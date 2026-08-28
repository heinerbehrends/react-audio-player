# Refactor Plan: External Store Architecture

Status: Phases 0 through 3 landed, and most of Phase 4 with them. The callback bus, all three
slider reducer stacks, `AudioContext`, `PlayerContext` and their providers are gone. Two
contexts remain — the player store and one `SliderContext` per slider — and the `<audio>`
element carries one handler, which is policy rather than projection.

346 jsdom tests and 51 E2E tests, up from 386 and 19 at the start; the jsdom count fell
because ~16 files were deleted with their subjects, and what replaced them tests behaviour
against a constructed store rather than reducers. `src/` is 2,976 lines across 34 files,
down from 3,294 across 57 — and 271 of those lines are the demo app, which grew.

Phase 5 (strip the memo layer) and Phase 6 (measure and reconcile) remain, plus one Phase 4
item: the CSS transition on the progress element. Bundle figures below were measured
2026-08-21 against commit `b4df69c` and are stale.

## 1. Why

Every media value currently exists in three places at once:

| Value | Source of truth | Mirror 1 | Mirror 2 |
|---|---|---|---|
| `currentTime` | `el.currentTime` | timeline slider `value` | `useTimeDisplay` state |
| `volume` | `el.volume` | volume slider `value` | player `volumeState` / `isMuted` |
| `playbackRate` | `el.playbackRate` | playbackRate slider `value` | player `playbackRate` |
| `duration` | `el.duration` | timeline `maxValue` | player `duration` |
| `paused` | `el.paused` | player `playerState` | — |

The mirrors live in sibling subtrees, so updates have to travel sideways. That is what
`AudioContext` + `useAttachSliderCallback` are: a hand-rolled pub/sub built from mutable
refs. The `memo` / `useMemo` / `useCallback` layer then exists to stop the resulting
context values from re-rendering everything.

**Delete the mirrors and the machinery has nothing left to do.** That is the whole
refactor. The win is that ~1,000 lines of state-sync machinery stop existing — not bundle
size, and not a bug count.

Two design faults, both currently latent, both of the same kind: correct only by accident
of render timing.

- `src/AudioElement/useAudioElement.ts` reads `audioElementRef.current` **during render**.
  Three consumers: `useTimelineAria.ts` (the timeline's `aria-valuetext`),
  `PlaybackRate/ChangePlaybackRate.tsx` (computes `newRate = playbackRate + amount`), and
  `Volume/volumeHooks.ts` — which is dead code, imported by nothing in `src/`. All three
  read fresh values today only because they also subscribe to `PlayerContext`, which
  updates on the very event that changed the element. It is a tearing hazard under
  concurrent React, and `ChangePlaybackRate` becomes a live "+0.1 from a stale base" bug
  the moment Phase 2 removes its incidental subscription.
- `src/AudioElement/AudioElement.tsx:37-41` reads a ref during render to decide whether to
  attach `onTimeUpdate`. The ref is populated by an effect in a *child*, so it works only
  by luck of the current `memo` boundaries. It survives until Phase 3, because the gate is
  checking for bus callbacks.

## 2. Decisions taken

| Decision | Choice | Rationale |
|---|---|---|
| React peer | **`>=18.0.0`** (done) | `useSyncExternalStore` is React 18. The old `>=16.3.0` was already wrong — the code is hooks-only. |
| Store primitive | **hand-rolled `atom` + `useStore`**, ~20 lines | No dependency, no swap deferred to later, and the README's zero-dependency claim stays true. |
| Derived values | **computed in render**, not in the store | `playerState` and `volumeState` are pure functions of primitive atoms. Deriving them in render removes the need for a `computed` primitive — the one piece with a genuinely subtle cache-invalidation failure mode. |
| Load lifecycle | **one `loadState: "loading" \| "ready" \| "error"` atom**, not `hasMetadata` + `errored` | Two bools describe four states for three real ones, and the unreachable fourth is a version of the bug the reset row fixes. One atom, two subscriptions for `playerState`, and transitions that assign constants so the sync layer still never reads an atom. |
| Element handle | **closure variable reached through `attach`**, not an atom | Nothing subscribes to it, and `attach` is the one door that can write a projection — which is what keeps every `set` inside the factory closure instead of on the returned object. |
| Listener attachment | **eager, one effect keyed on the element, priming before it subscribes** | Lazy per-atom mounting re-creates the render-timing coupling it was meant to remove, and a write to an unsubscribed atom costs nothing. |
| Write path | **Unchanged, with one exception in Phase 2** | `handleSideEffect` and the `SideEffectAction` union are good, and the union is public API via `customKeyboardShortcuts`. It is currently pure over the element, which is what makes the Phase 0 test investment cheap. The exception: `TOGGLE_MUTE` / `UNMUTE` / `DRAG_START` need `lastAudibleVolume`, so the signature grows a store accessor in Phase 2. See below. |
| Instance scoping | **Per-instance factory in a stable context** | Module-level atoms would break two players on one page and leak state across SSR requests. |
| Slider variation | **`mode: "seek" / "volume" / "rate"`** | The three sliders differ on two correlated axes, in only three combinations. One discriminant, read in one place. |
| Slider-local state | **One `SliderContext` per slider instance** | Geometry and drag state are local to a slider but shared across its sibling subcomponents. Compound components need a context; that is not the same as a bus. |
| Entry points | **Single entry**, `sideEffects: false` | Six entries were the *cause* of the duplicate-context bug. One entry makes it unrepresentable. |
| Time resolution | **`currentTime` (4 Hz) for pixels, `currentSecond` (1 Hz) for text and aria** | Assistive technology reads `aria-value*` off the `role="slider"` node through the accessibility tree, focused or not. rAF is an accessibility regression, not a CPU trade. |
| Memoisation | **Strip all, add back only on measurement** | Reducing `memo` / `useMemo` is an intention of the refactor, not a side effect. |
| E2E in CI | **Blocking** | It already is, as of `b4df69c`. `testE2E:local` is a convenience for a machine-specific Chromium, not the gate. |

## 3. Target architecture

### The invariant that keeps it clean

Two classes of atom, and the distinction is load-bearing:

> **Projection atoms** are read-only projections of the audio element. Nothing writes them
> except `syncFromElement`. All mutation goes through `send()` to the element, then a media
> event, then the atom.
>
> **UI atoms** are shared React state that happens to live in the store. There is exactly
> one: `timeDisplay`. It is writable.

Enforce it by typing projections as `{ get, subscribe }` and keeping the `set` handles
inside the factory closure — reachable only through `attach`, described under *Store shape*.
Break this rule and the mirror problem grows straight back.

Corollary, load-bearing because of `useSyncExternalStore`'s "getSnapshot should be cached"
invariant: **never return a fresh object from a store read.** Atoms hold primitives; derive
objects in render. This constrains *store reads only* — a `SliderContext` value may be
freshly created, because it is a context value, not a snapshot.

### The primitive

```
src/store/
  atom.ts               # atom + useStore -- the whole dependency surface
  createPlayerStore.ts  # the factory
  syncFromElement.ts    # media events -> atoms (the ONLY writer)
  PlayerStoreContext.tsx
```

```ts
export function atom<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return;   // 4 Hz writing the same second costs nothing
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => (listeners.add(l), () => void listeners.delete(l)),
  };
}

export const useStore = <T>(a: ReadableAtom<T>) =>
  useSyncExternalStore(a.subscribe, a.get, a.get);   // 3rd arg = SSR snapshot
```

`get` and `subscribe` are per-atom stable references, so `useSyncExternalStore` never
resubscribes. The identity bail-out in `set` is what makes `currentSecond` free.

`Object.is`, not `===`, because React compares snapshots with `Object.is` and the two must
never disagree: any value where they differ would mean the atom notifies and React then
declines to re-render, or the reverse. `NaN` is the case that separates them, and the
primitive cannot know whether a caller will ever write one — the sync layer normalises
`duration` through `finite()`, so today none reaches an atom, but that is the *caller's*
guarantee, not the atom's. Matching React costs nothing and keeps the primitive honest
whatever gets written through it.

### Store shape

```ts
export type ReadableAtom<T> = {
  get: () => T;
  subscribe: (listener: () => void) => () => void;
};

export function createPlayerStore() {
  // projections of the element -- written only by syncFromElement
  const currentTime       = atom(0);   // ~4 Hz, pixels only
  const currentSecond     = atom(0);   //  1 Hz, text and aria
  const duration          = atom(0);
  const volume            = atom(1);
  const muted             = atom(false);
  const lastAudibleVolume = atom(1);   // replaces el.dataset.dragStartVolume
  const rate              = atom(1);
  const paused            = atom(true);
  const loadState         = atom<"loading" | "ready" | "error">("loading");

  // UI state, genuinely shared, writable
  const timeDisplay = atom<"elapsed" | "remaining">("elapsed");

  let element: HTMLAudioElement | null = null;

  // The only door out of the closure that can write a projection. Sets the
  // element, primes every atom from it, subscribes, and returns the detach.
  const attach = (el: HTMLAudioElement) => {
    element = el;
    const detach = syncFromElement(el, atoms);   // primes, then subscribes
    return () => { detach(); element = null; };
  };

  const send = (action: SideEffectAction) => handleSideEffect(action, element);

  return { /* projections as ReadableAtom */, timeDisplay, send, attach };
}
```

**`attach` is why the invariant holds literally rather than by convention.** Phase 1 has to
write the element and run the sync layer, and neither is expressible through
`{ get, subscribe }` projections — so without `attach` the factory would have to hand out
`set` handles and the rule would survive only as a comment. One extra member closes it: every
`set` stays inside the closure, and the sync suite becomes
`createPlayerStore().attach(stub)` followed by dispatching events on the stub — no React, no
jsdom, no provider.

**The element is a closure variable, not an atom.** Nothing subscribes to it: `send` reads it
directly, and the one render-time reader of the element ref today
(`AudioElement.tsx:39-43`'s handler gate) is deleted in Phase 3. An atom would buy a
subscription nobody wants and a `set` handle the invariant then has to forbid.

Derived values are computed in render, never stored:

```ts
function usePlayerState() {
  const loadState = useStore(store.loadState);
  const paused    = useStore(store.paused);
  return loadState !== "ready" ? loadState : paused ? "paused" : "playing";
}
```

Two subscriptions instead of one, returning a primitive — so the `getSnapshot` hazard cannot
apply, and there is no cache to invalidate. `playerState` is now an extension of `loadState`
rather than a reconstruction of it: the two non-`"ready"` states pass straight through, and
TypeScript narrows them for you.

### The sync layer

One effect keyed on the element, priming every atom and then attaching every listener. It
re-runs when the element changes, so there is no ordering assumption anywhere. The effect
lives in `AudioElement`, which owns the `<audio>` tag — see Phase 1.

| Event | Writes |
|---|---|
| `timeupdate` | `currentTime = el.currentTime`, `currentSecond = Math.floor(el.currentTime)` |
| **`seeked`** | the same two |
| `loadedmetadata` | `duration = finite(el.duration)`, `loadState = "ready"` |
| `durationchange` | `duration = finite(el.duration)` |
| `volumechange` | `volume = el.volume`, `muted = el.muted`, and `lastAudibleVolume = el.volume` when `!el.muted && el.volume > 0` |
| `ratechange` | `rate = el.playbackRate` |
| `play` / `pause` / `ended` | `paused = el.paused` — projected, never toggled |
| `error` | `loadState = "error"` |
| `emptied` / `loadstart` | `prime(el)` — the whole projection, re-read |

where `finite(d) = Number.isFinite(d) ? d : 0`. Every row writes what it reads off the
element and nothing else — no row computes, and no row reads an atom.

**`loadState` is a state machine whose transitions never read the current state.** Each of
the three events assigns a constant — `"ready"`, `"error"`, `"loading"` — so the "no row
reads an atom" property above survives the collapse. That matters: a state machine is exactly
the shape that tempts you to branch on where you already are, and the moment `syncFromElement`
reads an atom to decide what to write, it stops being a projection. The media element makes
the unconditional form safe: a `src` swap fires `emptied` then `loadstart` before anything
else, and no `loadedmetadata` follows an `error` without a `loadstart` in between.

It replaces a `hasMetadata` / `errored` bool pair. Two bools describe four states for three
real ones, and the fourth — errored *and* has metadata — is a version of the bug the last
table row fixes. One atom makes it unrepresentable, drops `playerState` to two
subscriptions, and gives the whole load lifecycle one name to test against.

**`seeked` is not optional.** It is the fast echo path after any write to
`el.currentTime` — drag release, click-to-seek, and every keyboard seek — and
`AudioElement.tsx:50` wires it today (`onSeeked={handleTimeUpdate}`). Without it the atom
carries a stale time until the next `timeupdate`, up to ~250 ms. See the retain-until-changed
rule under *The sliders*, which depends on it.

`duration` is normalized on write: `Number.isFinite(el.duration) ? el.duration : 0`. It is
`NaN` before metadata and `Infinity` for live streams, and `formatTime` renders those as
`"NaN:NaN"` and `"Infinity:NaN"`. Today's `?? 1` fallback does not catch either, so this is
a pre-existing bug that the sync layer is simply the right place to fix. Live streams then
read as `duration: 0`, which is honest — a seek bar over an unbounded stream is meaningless
— and gating UI on `loadState === "ready" && duration > 0` covers it. Full live-stream
support is out of scope.

**One `prime(el)`, called by `attach` and by the `emptied` / `loadstart` handler.** It reads
the whole projection off the element in one pass:

```ts
const prime = (el) => {
  volume.set(el.volume);
  muted.set(el.muted);
  rate.set(el.playbackRate);
  paused.set(el.paused);
  currentTime.set(el.currentTime);
  currentSecond.set(Math.floor(el.currentTime));
  duration.set(finite(el.duration));
  loadState.set(el.error ? "error" : el.readyState >= 1 ? "ready" : "loading");
};
```

*Why `attach` primes at all.* Today's handlers are JSX props, attached when the element is
created; an effect attaches *after* the element exists with its `src` set, so anything that
fires in between is lost. Two events matter. Miss `loadedmetadata` and `loadState` never
leaves `"loading"` — `playerState` pins to `"loading"` and `useIsDisabled` disables six
components permanently. Miss `error` and it is worse, because no further `error` event ever
fires for that load: the player sits disabled with no `ErrorMessage`, which is the first half
of the `Player/error-recovery` spec. Reading `el.error` is what makes the failure path as
covered as the success path.

This is not only an initial-load race. `StrictMode` remounts effects, so every mount is
attach → detach → attach, and any event landing in that gap is lost by construction. Priming
on every attach is what makes "no ordering assumption anywhere" true rather than aspirational.

*Why the reset row is the same function.* A `src` swap runs the media load algorithm, which
sets `paused` to true and resets `playbackRate` to `defaultPlaybackRate` **without firing
`pause` or, reliably, `ratechange`** — it fires `emptied` and `loadstart`. Enumerating the
atoms to reset therefore means tracking which silent element mutations the algorithm performs,
and getting that list wrong is a fresh mirror desync in the row whose whole job is cleaning up
after a swap: `paused` stuck at `false` while the element is paused, so `playerState` reports
`"playing"` and `PlayButton` shows Pause. Re-reading everything cannot be wrong. It also lands
`loadState` correctly for free — at `emptied` time `readyState` is 0 and `el.error` is null, so
`prime` yields `"loading"`, which is exactly what the row wants.

**`paused` is projected, not toggled.** Today `onPlay` and `onPause` both dispatch
`TOGGLE_PLAY` (`audioElementHooks.ts:114-116`), so one stray or duplicated event inverts the
UI until the next one corrects it. Reading `el.paused` on all three events cannot desync.
Name it in the commit; the test asserts the projection rather than inheriting the toggle.

**`lastAudibleVolume`'s predicate is `!el.muted && el.volume > 0`,** which is deliberately
*not* today's `areNumbersClose(volume, 0)` (`audioElementHooks.ts:32-34`). The old
approximate check exists because the volume slider can land a hair off zero and the UI
treats that as muted; the atom is a memory of what to restore, so an audible-but-tiny volume
is still worth remembering. The mute *derivation* keeps the approximate rule; the memory
does not.

`syncFromElement(el, atoms)` needs only `addEventListener`, `removeEventListener` and the
media properties `prime` reads — including `readyState` and `error`, or neither failure case
above is writable as a test — so it is directly unit-testable against a stub, with no jsdom
audio and no rendering. That is the primary gate on Phase 1 and the replacement for most of
the reducer tests Phases 2–3 delete.

The last row fixes a live bug: today `AUDIO_FILE_ERROR` sets `playerState: "error"`
permanently and `AUDIO_FILE_LOADED` only recovers from `"loading"`, so a failed `src`
followed by a good one stays broken.

`lastAudibleVolume` replaces the `el.dataset.dragStartVolume` stash-and-restore in
`handleSideEffect`'s `DRAG_START` / `TOGGLE_MUTE` / `UNMUTE` cases. That hack only covers
the drag path, which is why clicking the far-left of the volume slider currently dead-ends:
`SET_SLIDER_VALUE` sets `volume: 0` without muting and without stashing, so the following
mute/unmute pair leaves a silent player with an unmuted UI and no way back. Remembering the
last audible volume covers every path — drag, click, keyboard, or a consumer's
`CHANGE_VALUE` binding. **Behaviour change:** unmute after a drag restores the last audible
volume, not specifically the pre-drag volume. Land it as a named commit.

**A volume drag pins the memory, so unmute restores the pre-drag volume.** As landed in
Phase 2, `lastAudibleVolume` updates on every `volumechange`, and a drag emits those
continuously — so a drag to zero erodes the memory down to the last non-zero sample the drag
passed through. Measured: unmuting after a drag that started at 0.8 restored 0.04. Audible,
but not what the user had. The values a drag *passes through* are not settings anyone chose;
only the value it starts from and the value it ends on are. So the drag pins the memory:

- `DRAG_START` on the volume slider writes `lastAudibleVolume` from `el.volume` and takes a
  pin.
- While the pin is held, the `volumechange` row skips its `lastAudibleVolume` write. Every
  other atom that row writes is unaffected — `volume` and `muted` keep projecting at drag
  rate, because the thumb needs them.
- `DRAG_END` releases it, and so does a pointer cancel. `useSlider` owns that, because it
  owns drag state; releasing on `DRAG_END` alone would leave the memory frozen after a
  cancelled drag.

The pin is a closure variable in `createPlayerStore`, not an atom: nothing subscribes to it,
and an atom would hand out a `set` handle the projection invariant then has to forbid — the
same argument that keeps `element` out of the atoms. It **is** an exception to "no row reads
anything but the element", and it is the only one, so it goes in the signature rather than in
a closure: `syncFromElement(el, atoms, { isVolumePinned })`. A reader of the sync table can
then see that exactly one row has a condition, and where the condition comes from.

Ordering note, load-bearing: the volume slider sends `UNMUTE` *before* `DRAG_START` — today's
`useHandleDragStart` already does, and `useSlider` has to keep it. Grabbing the thumb of a
muted, silent player unmutes it to the remembered volume first, so the value the pin captures
is an audible one rather than 0.

*Sequencing.* This is the one place the write path changes: those three cases need store
state, so `handleSideEffect` grows a store accessor. It cannot land in Phase 0, because the
store does not exist until Phase 1, and fixing the dead-end twice — `dataset` in Phase 0,
atom in Phase 2 — would violate this plan's own rule about not investing in the condemned.
So: **three of Phase 0's ten new `handleSideEffect` tests get rewritten in Phase 2**, and
the volume-click E2E spec lands in Phase 2 with the fix rather than in Phase 0. Phase 0's
mute spec pins the drag path, which works today. Deliberate churn, not drift.

### `ended`: element and UI currently disagree

`handleEnded` pushes `UPDATE_UI_VALUE value: 0` to the timeline while the element sits at
`duration` (`audioElementHooks.ts:70-78`) — the thumb returns to the start, the element does
not. It is the mirror problem in miniature, and under pure projections the thumb would stay
at the end.

Remove the divergence by moving the element: `<audio onEnded>` calls
`send({ type: "SET_TIME_TO_START" })`. The element goes to 0, `seeked` fires, the atoms
follow, the thumb returns to the start — and element and UI now agree.

The thumb behaves as it does today, but **the elapsed clock changes.** `useTimeDisplay`
reads the element, so today a finished track shows ~duration on the clock while the thumb
sits at 0 — the two disagree on screen, which is the mirror problem in its most visible
form. Afterwards both read 0. That is the intended outcome and it is a visible change, so
it gets an E2E row (`Timeline/ended`) asserting the intended state, landing with this
commit in Phase 3.

This is *policy*, not projection, so it stays a handler on the element and does not go into
`syncFromElement`, which keeps projecting only `paused` from `ended`. It lands in Phase 3,
when the timeline bus push it replaces is deleted.

### The sliders

The three differ on two axes, in three of the four possible combinations — so one
discriminant, resolved from a single `SLIDER_MODES` table that `useSlider` reads:

| | `"seek"` | `"volume"` | `"rate"` |
|---|---|---|---|
| element written during drag | **no** — commit on release | yes | yes |
| mute coupling: unmute on grab, remember audible volume, mute at zero | no | **yes** | no |
| `max` | `duration` atom | 1 | prop, default 4 |

That table is the point of Phase 3. The three reducers look accidentally different only
because they serve those two strategies: `"seek"` keeps a local value to display because
nothing echoes back mid-drag, while `"volume"` and `"rate"` get their value from the
element via `volumechange` / `ratechange`. The `clientXY` each reducer stores on `DRAG` is
dead state — `calculateDragStyle` reads `value` via `getOffset`, never `clientXY`. Do not
go looking for intent there.

Two fixes fall out, each its own commit:

- **`offsetFromMiddle` is ignored during volume and rate drags.** `"seek"` subtracts it;
  the other two call `calculateSliderValue` on the raw `clientXY`, so grabbing the thumb
  off-centre jumps the value on first move. `"seek"` semantics win. Phase 0 pins today's
  jump in E2E, so this commit has to flip that assertion — the change cannot pass silently.
- **Vertical progress inversion stops being a mode concern.** It is currently keyed on
  `component === "volume" && vertical` in `calculateStyle.ts`, only because `getOffset`
  already inverts for vertical and `getProgress` has to undo it — a double negative that
  happens to cancel. Derive from `orientation` alone, and a vertical timeline works instead
  of rendering backwards. Pin the current vertical-volume behaviour with a test *before*
  touching it.

Display always reads the local drag value while dragging, in all three modes. For
`"volume"` and `"rate"` that removes echo latency rather than adding behaviour.

But dropping the local value the instant the drag ends is wrong: `onCommit` writes
`el.currentTime`, drag state clears, and display falls through to an atom that still holds
the pre-drag value until the element echoes back — a visible snap-back of up to ~250 ms in
`"seek"` mode. Today `timelineReducer`'s `DRAG_END` retains `value: time`
(`timelineReducer.ts:85-95`), so it cannot happen.

So `useSlider` **retains the last committed value until the store reports a different
one**:

```ts
const displayValue =
  drag.state === "dragging" ? drag.value
  : committed !== null && committed !== valueFromStore ? committed
  : valueFromStore;
```

This is a property of `useSlider`, not of the seek mode's commit handler, because
click-to-set via `SET_SLIDER_VALUE` has exactly the same gap. It depends on `seeked` being
in the sync table — that is the event that clears `committed`.

Today `AudioElement` reaches into `TimelineContext` to ask "is the user dragging?" before
deciding whether to push a time update down the bus (`audioElementHooks.ts:11`).
Afterwards the slider simply decides what to display.

**The aria surface never updates faster than 1 Hz, and that is a rule about attribute values,
not about renders.** One `SliderContext` feeds both `SetSliderValue` (which renders every
`aria-value*`) and `Timeline.Progress` (pixels), so the context object necessarily changes at
4 Hz in `"seek"` mode and `SetSliderValue` re-renders with it. That is fine: React writes a
DOM attribute only when its value changes, so what matters is which atom the attribute is
*computed from*. So `useSlider` returns two things, not one:

- `value` — from `currentTime`, consumed by `Progress` and `Drag` for pixels.
- the aria surface — `aria-valuenow` and `aria-valuetext` from `currentSecond`, which is
  where the 1 Hz guarantee actually lives.

Only `"seek"` mode has two sources. `"volume"` and `"rate"` read the `volume` / `rate` atoms,
which are event-driven rather than sampled, so both fields come from the same atom there.

One consequence to respect when the mode table lands: a keyboard step smaller than a second
would move `currentTime` without moving `currentSecond`, so `aria-valuenow` would not change
and the press would be announced as a no-op. The default arrow step is 5 s and the smallest
built-in seek is 5 s, so nothing today is affected — but it constrains
`customKeyboardShortcuts`, and it is the reason `aria-valuenow` reads seconds rather than a
rounded `currentTime`.

Phase 4 does the quantizing and drops the 1 Hz `setInterval`; Phase 3's job is only to leave
room for it, by having `useSlider` return two values rather than one. Get that contract wrong
and Phase 4 has nowhere to put the second subscription.

### What lives where

| State | Where it goes | Why |
|---|---|---|
| `currentTime`, `currentSecond`, `duration`, `volume`, `muted`, `lastAudibleVolume`, `rate`, `paused`, `loadState` | store atom | projections of the element |
| `playerState`, `volumeState`, `isMuted`, `remaining` | derived in render | derived; not storable without desync |
| `timeDisplay` | store atom (the one UI atom) | shared UI state, not on the element |
| `dragState`, `drag.value`, `sliderStart`, `sliderLength` | **per-slider `SliderContext`**, from `useSlider` at the slider root | local to one slider, but read by its sibling subcomponents |
| `audioFiles`, `customKeyboardShortcuts`, slider `min` / `step` / `orientation` | **props** | static config |
| timeline `max` | `duration` atom | not static — it *is* the duration |

`dragState` and geometry cannot be `useState` inside `useSlider`: one slider is three
sibling components, and the geometry is measured by `Timeline.Seek` (`SetSliderValue`'s ref
callback and ResizeObserver) while `Timeline.Progress` and `Timeline.Drag` consume it.
Consumers place those three freely in their own markup, so there is no prop-drilling path
either. `<Timeline>` calls `useSlider` once at the root and publishes the result:

```tsx
function TimelineRoot({ children, ...props }) {
  const slider = useSlider({ mode: "seek", max: useStore(store.duration), ... });
  return <SliderContext.Provider value={slider}>{/* ... */}</SliderContext.Provider>;
}
```

What dies is the **bus** — `AudioContext`'s four mutable callback refs,
`useAttachSliderCallback`, and the three reducers that existed to receive element state
pushed sideways. What stays is one context per compound component, flowing strictly
downward. That is how compound components work, and this library is Radix-inspired by
design. Context count after Phase 3: two — the player store and `SliderContext`,
instantiated once per slider.

## 4. Migration steps

Each phase leaves the library working and is reviewable on its own.

### Phase 0 — Public surface, known bugs, and coverage — **landed**

Lands first: it changes the public surface, and it is easier to refactor against the
surface you intend to keep. Nothing here depends on the store.

It did not all land first in the end: the entry points, public surface and accessibility fix
went in before Phase 1, and the bugs, the test investment and the E2E net went in after
Phase 2, once it was clear Phase 3 could not safely start without them. The one row still
open is `Timeline/ended`, which asserts intended behaviour and belongs to a Phase 3 commit.

**Entry points**

- [x] Single entry. Drop the five subpath exports and revert `splitting: true`. Six entries
      were the cause of the duplicate-context bug — each entry shipped its own
      `createContext` calls, so mixing `react-audio-player/timeline` with
      `react-audio-player/player` produced two distinct `AudioContext` objects and a
      silently dead timeline, with no error, because `useContext` returns the default. One
      entry makes it unrepresentable, which matters because Phase 1 adds a context.
- [x] Add `"sideEffects": false` to `package.json`. A consumer importing only `Volume` from
      the root then tree-shakes to what a subpath would have given them — they need
      `AudioPlayer` regardless, since it owns the store.

**Public surface** — replace the five `export *`s with one explicit list. `export *` is how
`MuteButtonComponent`, an implementation detail, reaches consumers today, and how the
surface drifted out of sync with the README.

```ts
// src/index.ts -- the entire public surface
export { AudioPlayer } from "./Player/AudioPlayer";
export { PlayButton } from "./Player/PlayButton";
export { MuteButton } from "./Player/MuteButton";
export { Seek } from "./Player/Seek";
export { ErrorMessage } from "./Player/ErrorMessage";
export { Timeline } from "./Timeline/Timeline";
export { Volume } from "./Volume/Volume";
export { PlaybackRate } from "./PlaybackRate/PlaybackRate";
export { PlaybackRateSlider } from "./PlaybackRate/PlaybackRateSlider";
export { Time } from "./TimeDisplay/TimeDisplay";
export type { SideEffectAction } from "./AudioElement/sideEffectActions";
export type { KeyToActionMap } from "./KeyboardControls/handleMediaKeys";
```

- [x] `PlayButton`, `MuteButton`, `Seek`, `Error` and `PlaybackRateSlider` are documented in
      the README but never exported — the README's own Basic Usage example does not run.
- [x] Rename `Error` to `ErrorMessage`. `import { Error }` shadows the global for the rest
      of that consumer module.
- [x] Add `PlaybackRateSlider.Progress`. It is the only slider without one, and that
      asymmetry is a real API gap. The slider itself works — stepping is functional via
      `handleSideEffect`'s `DRAG` case, so the README roadmap line "Finish stepped playback
      rate slider" is stale.
- [x] Export `KeyToActionMap` and `SideEffectAction`. `customKeyboardShortcuts` is typed
      public API and consumers currently cannot name the type they are required to
      construct.
- [x] Delete `Volume/volumeHooks.ts` and its test — dead code.

**Accessibility: slider semantics and keyboard handling live on different elements.**
`SetSliderValue` carries `role="slider"`, every `aria-value*` — and `tabIndex={-1}`
(`SetSliderValue.tsx:51,55`). `DragButton` is the focusable element and carries only
`aria-label`: no role, no values. So a keyboard user tabs to a thumb with no slider
semantics, and the element that *has* the semantics is not reachable by Tab at all. In a
library whose first feature bullet is accessibility, this outranks the
`PlaybackRateSlider.Progress` gap above.

- [x] Move the semantics onto the element that is always present: `SetSliderValue` gets
      `tabIndex={0}` and the arrow-key handler; `DragButton` becomes `tabIndex={-1}` and
      `aria-hidden`, a pure visual affordance. Smallest diff — the `aria-value*` attributes
      are already there — and it works even when a consumer renders no `Drag` thumb, which
      the headless API allows.
- [x] E2E: the semantic slider is reachable by Tab, announces a value, and responds to
      arrow keys.

Per-mode arrow keys — so the rate slider responds to arrows at all — land in Phase 3 with
the mode table, since that is where the key handling becomes mode-aware.

Removing the thumb's semantics also removed its accessible name, which was the E2E and
jsdom handle for it. The demo app grew a `data-testid="timeline-drag-thumb"` hook instead,
surfaced as `testIds` in `testE2E/test-utils.ts`; the label belongs to the slider now, and a
thumb label saying "use left and right arrow keys" would have been a second lie on a hidden
node.

**Known bugs** — all falsy-zero or precedence slips, all cheap.

- [x] `TimeDisplay/useTimeDisplay.ts:19` — `duration ?? 0 - currentTime` parses as
      `duration ?? (0 - currentTime)`, so `remaining` is just the duration, constant.
      `<Time.Remaining>` renders the negated track length and never counts down. Present at
      both call sites; no test asserts the value; `<Time.Remaining />` is commented out in
      `App.tsx`.
- [x] `AudioElement/handleSideEffect.ts:139` — `action.step || 0.25`, so
      `<PlaybackRateSlider step={0}>` snaps to 0.25 on drag while click-to-set stays
      continuous. Use `??`.

**Unit tests before the refactor — cover the survivors, not the condemned.** ~15 test files
die in Phases 2–3; tests written for reducers, providers, contexts,
`useAttachSliderCallback` or `useAudioElement` are work you will delete. These modules pass
through unchanged, so their tests keep their value permanently *and* act as the oracle for
"did I change behaviour I meant to preserve":

**`handleSideEffect` — 11 new cases.** 12 of 22 actions are covered, and the untested ten
are exactly the keyboard actions. So `handleMediaKeys.test` verifies key → action and
nothing verifies action → element: two half-covered layers that never meet. Append to
`testJSDom/AudioElement/handleSideEffects.test.ts` using its existing fake — a plain object
cast to `HTMLAudioElement` with `play`/`pause` as `vi.fn()`. The fake needs `duration` and
`dataset: {}` added; the missing `dataset` is *why* `DRAG_START` is untested today, since
`audioElement.dataset["dragStartVolume"] = …` throws on it.

| # | Action | Asserts |
|---|---|---|
| 1 | `INCREASE_VOLUME` | clamps at 1 |
| 2 | `DECREASE_VOLUME` | from 0.02 by 0.025 → `muted: true` **and `volume` left at 0.02** — it returns before assigning |
| 3 | `INCREASE_PLAYBACK_RATE` | clamps at 4 |
| 4 | `DECREASE_PLAYBACK_RATE` | clamps at 0.5 |
| 5 | `RESET_PLAYBACK_RATE` | → 1 |
| 6 | `SET_TIME_FORWARD` | clamps at `duration` |
| 7 | `SET_TIME_FORWARD` negative | the `<Seek amount={-10}>` path: no lower clamp of its own — pins today's reliance on the browser |
| 8 | `SET_TIME_BACKWARD` | clamps at 0 |
| 9 | `SET_TIME_TO_START` | → 0 |
| 10 | `SET_TIME_TO_PERCENT` | → `duration * percent` |
| 11 | `DRAG_START` volume | stashes `dataset.dragStartVolume`; ignored for the other two components |

Cases 1–5 and 11 have no E2E cover either — the volume and rate keys are untested at both
layers.

Case 11 is this section's one deliberate exception to "cover the survivors": Phase 2
replaces the `dataset` stash with `lastAudibleVolume`, so the test is rewritten there. It
earns the churn by pinning the mute round-trip the replacement has to preserve — but it is
the one unit test here written in the knowledge that it will be thrown away.

**`formatTime` — move to the `sharedFunctions` suite and extend to H:MM:SS.** The three
assertions live in `Time.test.tsx:50-52`, which is the wrong file.

H:MM:SS above an hour is the **one deliberate behaviour change in Phase 0** — neither a bug
fix nor coverage. Taken knowingly: `"61:01"` is wrong for hour-plus content, which is
ordinary for an audio player, and the change is cheap and self-contained. It lands as its
own commit and touches `Time.Elapsed` / `Remaining` / `Duration` and the timeline's
`aria-valuetext`.

Non-finite input is a **live rendering bug**, not a live-stream question. Today
`formatTime` emits `"Infinity:NaN"`, `"NaN:NaN"` and `"-1:-5"` for `Infinity`, `NaN` and
`-5`. Reachable from a live stream, but also from a corrupt file, from `duration` before
metadata, and from `duration - currentSecond` while duration is still `NaN`. One clamp
covers every case:

```ts
const t = Number.isFinite(time) && time > 0 ? time : 0;
```

A distinct `"--:--"` token for unknown duration is deliberately **not** part of this. It
only means something beside a timeline that knows it is unbounded, so it ships with
live-stream support or not at all — see section 8. Shipping the placeholder alone would
look more supported than it is.

| Input | Expect |
|---|---|
| `0` | `"0:00"` |
| `65` / `120` / `121` | `"1:05"` / `"2:00"` / `"2:01"` (the existing three) |
| `3599` | `"59:59"` |
| `3600` | `"1:00:00"` |
| `3661` | `"1:01:01"` |
| `-5` / `NaN` / `Infinity` | `"0:00"` — one clamp, today `"-1:-5"` / `"NaN:NaN"` / `"Infinity:NaN"` |

**Grab-offset composition — 1 new test.** `calculateSliderValue` is covered, but not the
`clientXY - offsetFromMiddle` call pattern that Phase 3 generalises to all three modes.
Assert the property directly: for a fixed thumb centre, offsets of `-15`, `0` and `+15`
produce the **same** value. That is the invariant the volume/rate fix establishes, and it
fails today for those two.

**`calculateStyle` vertical inversion — the existing tests do not pin it.** All three
vertical cases in `calculateStyle.test.ts` use `defaultContext`'s `value: 0.5`, and 0.5 is
the fixed point of `x → 1 - x`, so inverted and non-inverted agree exactly. "handles
vertical volume component" asserts nothing about the inversion, and Phase 3's switch to
deriving from `orientation` alone would flip vertical volume with the suite still green.

- [x] vertical **volume** progress at `value: 0.25` and `0.8`
- [x] vertical **non-volume** progress at `value: 0.25` and `0.8`

Four assertions, and they are the only thing standing between Phase 3 and a silent
regression.

**E2E** — the plan leans on E2E as Phase 3's safety net, and today it covers nothing Phase 3
breaks. Fifteen tests across five specs, all timeline, seek and play/pause; zero coverage of
volume, mute, playbackRate or time display. The unit tests Phase 3 deletes are currently the
*only* automated check on volume and rate drag semantics.

Two rules decide what belongs here, and the second is the one that catches omissions:

1. Anything whose *only* automated check today is a test Phase 2 or 3 deletes — volume and
   rate drag semantics, which live solely in the reducer tests.
2. Anything the new architecture **derives** rather than stores. Derivation is where a
   threshold or an ordering changes silently, because there is no stored value to diff
   against. `volumeState`'s 0.5 boundary is the case in point: nothing pins it at any layer
   today, and Phase 2 turns it into a `computed`.

Three fixture changes first, all small:

- [x] Extend `getAudioState` in `testE2E/test-utils.ts` with `volume`, `muted` and
      `playbackRate`; add the volume, rate and mute labels to the `labels` map. *(landed with
      Phase 2, which needed it for `Volume/mute`.)*
- [x] Add a `?src=` URL param to `App.tsx`. It already reads `?orientation=` via
      `useUrlParams`, so this is two lines, and it lets one spec swap bad → good in a single
      page session — which is what tests *recovery* rather than just the error state.
- [x] Add a `?players=2` URL param to `App.tsx`, rendering two independent `<AudioPlayer>`s.
      The player body moved into a `Player` component to make that possible, and the volume
      and rate thumbs gained test ids alongside the timeline's.

| Spec | Test | Notes |
|---|---|---|
| `Volume/volume-drag` | drag thumb to 25% → `el.volume ≈ 0.25` | |
| | drag thumb to zero → `muted` | pins the `DRAG_END` mute-at-zero rule |
| | grab the thumb off-centre → value **jumps** by the grab offset | pins today's bug, so Phase 3's fix has to change it deliberately |
| `Volume/volume-click` | click track at 25% → `el.volume ≈ 0.25` | **landed in Phase 2**, in `Volume/mute`, as the "sets the volume without muting" case |
| | vertical (`?orientation=vertical`): drag up raises volume | pins the inversion end-to-end |
| `Volume/mute` | mute → `aria-pressed="true"`, `el.muted` | **landed in Phase 2** |
| | drag to zero, mute, unmute → volume is audible again | **landed in Phase 2**, on `lastAudibleVolume` rather than the `dataset` path. Asserts "audible" only; Phase 3's pin commit flips it to the pre-drag value |
| `Volume/volume-state` | volume 0.4 → `MuteButton.LowVolume` renders | the 0.5 threshold, untested at every layer today and a `computed` after Phase 2 |
| | volume 0.6 → `MuteButton.HighVolume` renders | |
| | muted → `MuteButton.Muted` renders, whatever the volume | |
| `PlaybackRate/rate-drag` | drag thumb → `el.playbackRate` lands on a 0.1 step | |
| | `<PlaybackRate.Set rate={1.5}>` → 1.5 and `aria-current` | |
| `KeyboardControls/media-keys` | Arrow Up / Down change `el.volume` | `seek-keys` covers only the time keys |
| | `>` / `<` change `el.playbackRate`; Backspace resets it | |
| `Player/multi-instance` | `?players=2`: play one → the other's element does not move | the only decision in section 2 with no verification attached; a per-instance factory bug is otherwise invisible until a consumer hits it |
| `TimeDisplay/time-display` | elapsed advances during playback | |
| | toggle → remaining shown, and it **counts down** | asserts the fixed value, so it lands after the precedence fix |
| `Timeline/ended` | play to the end → thumb at start **and** elapsed reads `0:00` | *intended*, not current: today the clock shows the full duration while the thumb is at 0. Lands with the Phase 3 `onEnded` commit |
| `Timeline/no-snap-back` | after drag release, sample progress every ~50 ms for ~500 ms; no sample falls below `target − ε` | the `seeked` + retain-until-changed guarantee. Sampled, not single-read: one post-release read can land either side of the echo and pass for the wrong reason |
| | after click-to-seek, same | |
| `Player/error-recovery` | `?src=` bad → `ErrorMessage` visible, controls disabled | |
| | then swap to a good src → `ErrorMessage` gone, controls enabled | the `loadState` reset on `loadstart` |
| `a11y/slider-semantics` | Tab reaches the element with `role="slider"` | fails today |
| | it exposes `aria-valuenow` / `aria-valuetext` | |
| | arrow keys on it change the value | |

Play/pause, timeline drag, click-to-seek and the seek keys are already covered by the
existing 15 tests, so the basic-operations requirement is met once the rows above land.

**Landed: 19 E2E tests to 50.** Every row above is in except `Timeline/ended`. Three notes
from writing them, each of which cost a debugging round:

- The demo's debug panel prints `Muted: false` and a volume state of its own, so an unscoped
  `getByText("Muted")` matches it. `volume-state` scopes its queries to the mute button.
- `Time.Toggle` is labelled "Toggle elapsed and remaining time", so `getByLabel("elapsed")`
  matches the button as well as the `<time>` element. `time-display` passes `exact: true`.
- Chromium drops clicks within ~1 px of an element's start, so the exact left edge of a
  slider track is not reachable. That is why the click-to-zero volume case is pinned by
  `handleSideEffect`'s unit tests rather than by an E2E row.

**Deliberately not E2E: the loading state.** `useIsDisabled` gates six components on
`playerState === "loading"`, but loading is transient and racy in a real browser. It belongs
in the jsdom tier in Phase 2 — construct a store, leave `loadState` at `"loading"`, assert the
buttons are disabled. Deterministic there, flaky here, and it is exactly the tier the store
makes cheap. *Landed: `testJSDom/store/loadingState.test.tsx`.*

**One row is not reachable in this harness.** Clicking the exact left edge of the volume
track is the only path to `volume: 0` that does not also mute, and Chromium drops clicks
within ~1 px of an element's start, so the click-to-zero dead-end is pinned by the
`handleSideEffect` unit tests instead. Worth knowing before writing an E2E row that depends
on hitting a slider's first pixel.

Write the drag-semantics specs against current behaviour before anything is deleted. Three
rows assert *intended* rather than current behaviour, so each follows its own fix: the
counting-down remaining time and the slider semantics land with their Phase 0 fixes, and
`Timeline/ended` lands with the Phase 3 `onEnded` commit. The off-centre grab row is the
opposite — it pins today's bug on purpose, so that Phase 3's `offsetFromMiddle` commit has
to flip an assertion rather than silently changing feel. Same for the volume-click row,
which is deferred to Phase 2 with `lastAudibleVolume`.

**README** — component list, dependency bullet, the stale roadmap line, and the
`## Requrements and` heading typo.

*Verify:* full suite green, `check-exports` green, root-import bundle back to its
pre-`splitting` size.

### Phase 1 — Store, sync layer, provider (no consumers) — **landed**

Add `src/store/*`. `PlayerStoreProvider` goes **outermost** in `AudioPlayer`, so Phases 2–3
delete the providers inside it without ever moving it. The store is created once via
`useState(() => createPlayerStore())`, so the context value never changes, and the provider
does nothing else — no state, no effect, render-inert. No component *subscribes* to an atom
yet, which is what the "this gate cannot fail" argument below rests on.

**`AudioElement` owns the element, not the provider.** It renders the `<audio>` tag, so it is
the only component that can hold the element without a setter travelling down — and a setter
reachable through context or props would be a second write-shaped door on a store whose whole
design is that `attach` is the only one:

```tsx
const [el, setEl] = useState<HTMLAudioElement | null>(null);
const store = usePlayerStore();

useEffect(() => (el ? store.attach(el) : undefined), [el, store]);

const ref = useCallback((node: HTMLAudioElement | null) => {
  audioElementRef.current = node;   // the legacy object ref, gone in Phase 3
  setEl(node);
}, [audioElementRef]);
```

`setEl` is stable by React's `useState` guarantee, so the composed ref is stable and
`AudioElement`'s `memo` cannot cause a detach/reattach on every parent render — the hazard
disappears instead of needing to be managed. `attach` returning its own detach slots straight
into the effect. In Phase 3, when the legacy `audioElementRef` goes, the callback collapses to
`setEl`.

Two things that are not optional:

- `attach` must be idempotent and its detach complete. The demo runs under `StrictMode`, so
  every mount is attach → detach → attach, and priming is what makes events lost in that gap
  harmless.
- Create the context as `createContext<PlayerStore | null>(null)` and have `usePlayerStore`
  throw on null. `AudioContext.ts:27-45` is the counter-example: it has a default value, so
  its `if (!context)` guard can never fire, which is why the duplicate-context bug was
  silent. Phase 2 migrates ten components onto this context — make a missing provider loud.

Commits, in order: `atom` + `useStore` → `prime` + `syncFromElement` → `createPlayerStore` →
provider and `AudioElement` wiring → `Debug` rows.

*Verify:* **not** "build passes, zero behaviour change" — that gate cannot fail. From here
to Phase 3 every media event is handled twice, by the sync layer and by the old bus; the
atoms are unsubscribed, so a wrong `syncFromElement` is invisible and would surface mid-Phase-2
among fifty component migrations. The real gates:

- the `syncFromElement` unit suite, written exhaustively here rather than incrementally —
  one test per row of the sync-layer table, asserting every atom that event feeds, plus the
  `currentSecond` bail-out and every `loadState` transition, including the full `"ready"` →
  `"error"` → `"loading"` → `"ready"` recovery walk. Keep the handlers in one table keyed by
  event name, so "one test per row" can be `Object.keys(HANDLERS)` checked against the
  documented event list — a missing row then fails a test instead of passing silently.
- the `prime` suite, which is where the two failure paths live: prime with `readyState >= 1`
  → `"ready"`; prime with `el.error` set → `"error"`, not `"loading"`; and a `src` swap while
  playing leaves `paused` true, the desync an enumerated reset row would have let through.
- the `atom` / `useStore` suite: subscribe, notify, unsubscribe, identity bail-out, multiple
  subscribers, and `Object.is` on `NaN`
- one shared media-element fake, in `testJSDom/store/`, replacing the ad-hoc one in
  `handleSideEffects.test.ts`. It needs `readyState` and `error` alongside the media fields,
  or neither failure path above is writable. Phase 2 needs the same fake for
  `lastAudibleVolume`, and two fakes drifting apart is how "two half-covered layers that never
  meet" happened the first time
- atom values rendered in the `Debug` view and visibly agreeing with existing reducer state
  during playback — the one moment where seeing both side by side is worth anything.
  `Debug.tsx` reads `PlayerContext` and slider geometry today and has no atom rows; adding a
  store column is part of this phase, not something already wired.

### Phase 2 — Retire `PlayerContext` — **landed**

Highest value, lowest risk: every field of `playerReducer` is either a command or a
derivation. Fifteen files reference `PlayerContext` today, so the ordering below is what
keeps the tree compiling.

#### Two things `PlayerContext` carries that are neither a command nor a derivation

These block the delete, and neither is in the migration list as written.

**1. Five action types in the *public* union.** `sideEffectActions.ts` imports
`TogglePlayAction`, `ToggleMuteAction`, `UnmuteAction`, `PauseAction` and
`AudioFileEndedAction` from `Player/PlayerContext.ts`. `SideEffectAction` is exported public
API as of Phase 0, so deleting that file breaks the published types. Move the five into
`sideEffectActions.ts` first — pure type move, its own commit, no behaviour. While there:
`SetPlaybackRateAction` is declared twice, once in each file, with the same shape. Collapse
it.

**2. Static config, with no carrier.** `audioFiles` and `customKeyboardShortcuts` are props
on `AudioPlayer` — not state, not projections, so no atom wants them — and `PlayerContext`
is their only transport today. `audioFiles` is read by `AudioElement`;
`customKeyboardShortcuts` by `useHandleMediaKeys`, which **seven** components call:
`PlayButton`, `MuteButton`, `Seek`, `SetPlaybackRate`, `ChangePlaybackRate`, `Time.Toggle`
and `SetSliderValue`. Section 3's table says "props" without naming a carrier, and there is
no path from `AudioPlayer`'s props to `SetSliderValue` except context.

So: **`PlayerConfigContext`**, holding `{ audioFiles, customKeyboardShortcuts }`, memoized
on those two props. Static config flowing strictly downward — the same reasoning that keeps
one `SliderContext` per slider — and its value changes only when the consumer changes props.
Context count lands at three: store, config, slider. Down from four plus three slider
stacks.

It is a drop-in swap: `AudioPlayer` already renders `PlayerStoreProvider` outermost with
`PlayerContextProvider` inside it, taking exactly these two props. `PlayerConfigProvider`
takes the same slot with the same props, and `PlayerStoreProvider` never moves — which is
what Phase 1 put it outermost for.

#### Derivations get one home

`src/store/derived.ts`:

| Hook | Subscribes to | Replaces |
|---|---|---|
| `usePlayerState()` | `loadState`, `paused` | `playerReducer`'s `playerState` |
| `useVolumeState()` | `volume`, `muted` | `SET_VOLUME_STATE` + `isMuted` |
| `useIsDisabled()` | `loadState` | `playerState === "loading" \|\| "error"` |

`useIsDisabled` drops to one subscription and one comparison, because `loadState` already
*is* the thing it was reconstructing. `isMuted` disappears entirely — it was a second mirror
of `muted`; `MuteButton`'s `aria-pressed` reads `useVolumeState() === "muted"`, which now
derives. Keep `areNumbersClose` for the near-zero rule inside `useVolumeState`: the mute
*derivation* stays approximate even though `lastAudibleVolume`'s memory is exact.

One file, so the derivation rule is auditable in one place rather than spread across the six
components that consume it.

#### `send` replaces `useHandleSideEffect`, and it is free

`store.send` is a closure member with a permanent identity. `useHandleSideEffect` returns a
fresh callback whenever the context's ref object changes, which is why its callers wrap it in
`useCallback`. So **every component migrated here deletes a `useCallback`** — Phase 5 work
arriving as a side effect of Phase 2. Don't count it twice when Phase 5 measures.

#### The write path's third argument is a value, not an accessor

`handleSideEffect(action, element, ctx)` where `ctx = { lastAudibleVolume: number }`, read by
`send` at call time from the atom. Only `TOGGLE_MUTE` and `UNMUTE` consume it. Passing a
snapshot rather than a store handle or a getter keeps the function pure over plain data —
which is the whole reason the Phase 0 investment was cheap, so **the three affected tests
gain an argument instead of a mock.**

`DRAG_START`'s volume case and all three `delete audioElement.dataset[...]` lines are
deleted, not migrated.

#### Migration

| Component | Reads today | Reads after |
|---|---|---|
| `PlayButton` | `playerState` ×3 | `paused`; and `useHandleClick` drops its read entirely — `send({ type: "TOGGLE_PLAY" })` already branches on `el.paused` |
| `MuteButton` | `volumeState` ×4 | `useVolumeState()` |
| `ErrorMessage` | `playerState` | `loadState === "error"` |
| `Seek` | `useIsDisabled` | unchanged call, new implementation |
| `Time.Toggle` | `timeDisplay`, `handlePlayerAction` | `useStore(timeDisplay)` + `timeDisplay.set` — `TOGGLE_TIME_DISPLAY` disappears, and it was never in the public union |
| `Time.Elapsed` / `Remaining` | `playerState`, `timeDisplay` | same two from the store; **the clock stays on `useTimeDisplay` until Phase 4** |
| `Time.Duration` | `duration` | `useStore(duration)` |
| `SetPlaybackRate`, `RateDisplay`, `useIsCurrent` | `playbackRate` | `useStore(rate)` |
| `ChangePlaybackRate` | the element ref, **during render** | `useStore(rate)` — the one live bug this phase fixes |
| `handleMediaKeys` | `handlePlayerAction`, `customKeyboardShortcuts` | `store.send` + `PlayerConfigContext` |
| `Debug.tsx` | `playerState`, `volumeState` | delete the reducer column; `DebugStore` already exists |

`Debug`'s store rows landed in Phase 1, so the work here is removing the `usePlayerContext`
reads above them — and one thing that is easy to miss: **`DebugStore` inlines its own
`playerState` derivation.** Once `derived.ts` exists, that duplicate has to go, or the debug
view can silently disagree with the app it is there to verify.

#### What `audioElementHooks` loses, exactly

"Half-emptied" is checkable, so here it is. Every `PlayerContext` dispatch goes, because the
sync layer already covers that event; every timeline-bus push stays until Phase 3.

| Export | Deleted here | Survives to Phase 3 |
|---|---|---|
| `useHandleTimeUpdate` | — | timeline `UPDATE_UI_VALUE` |
| `useHandleVolumeChange` | `SET_VOLUME_STATE` ×2, and the `areNumbersClose` mute rule — it moves into `useVolumeState` | volume `UPDATE_UI_VALUE` |
| `useHandlePlaybackRateChange` | `SET_PLAYBACK_RATE` | rate `UPDATE_UI_VALUE` |
| `handleEnded` | `AUDIO_FILE_ENDED` | timeline `UPDATE_UI_VALUE 0` |
| `handleLoadedMetadata` | `AUDIO_FILE_LOADED`, `SET_DURATION` | `SET_MAX_VALUE` |
| `handleDurationChange` | `SET_DURATION` | `SET_MAX_VALUE` |
| **`handleError`** | **the whole handler** | — |
| **`handlePlayPause`** | **the whole handler** | — |

So Phase 2 also deletes three JSX props from the `<audio>` element outright — `onError`,
`onPause`, `onPlay` — and `usePlayerCallbacks` drops from five members to three. The handler
count on the element goes 10 → 7 → 0 across Phases 2 and 3, which is a cheaper progress
check than reading diffs.

#### The jsdom harness is part of this phase

`testUtils.ts` exports `DEFAULT_PLAYER_CONTEXT` typed as `PlayerContextType`, which stops
compiling the moment the file is deleted, and `custom-render.tsx` wraps everything in
`<AudioPlayer>`.

Phase 1 already did the expensive half: `testJSDom/store/mediaElementFake.ts` exists and
`handleSideEffects.test.ts` has been switched onto it, so there is one fake, not two. What is
left here is `createTestStore()` — a store plus an attached fake — and a `custom-render`
option that mounts a component against it instead of a full `<AudioPlayer>`.

That is the "construct a store and set atoms instead of mocking jsdom audio" story section 5
promises. It has to exist before it can absorb the ~15 files Phases 2–3 delete, and this is
the phase that first needs it.

Tests removed: `playerReducer.test`, `PlayerProvider.test`.

#### Order

Move the five action types → `PlayerConfigContext` → `derived.ts` → test harness →
components, in small commits → `handleSideEffect` `ctx` + `lastAudibleVolume` → delete
`PlayerContext` / `PlayerProvider` / `playerReducer` → `Debug`.

Phase 2 comes before Phase 3 for a specific reason: `audioElementHooks` feeds both systems.
Killing the bus first would mean writing sync-layer-to-`PlayerContext` glue and then
deleting it.

*Verify:* play/pause, mute round-trip — including the click-to-zero spec that lands here
with `lastAudibleVolume` — seek, rate, error-recovery, and the a11y specs, since six
components' disabled state now comes from `loadState`. Plus one case the old code could not
get right: **a `src` swap while playing leaves `PlayButton` correct**, because `paused` is
re-primed rather than toggled.

#### What landed, and three deviations

Eight commits, in the order above. 373 jsdom tests and 22 E2E tests green;
`type-check`, `lint`, `build` and `check-exports` clean.

- **`useHandleSideEffect` survives Phase 2 as an alias for `store.send`.** It was going to
  keep reading `AudioContext`, but only `send` can supply the `lastAudibleVolume` snapshot
  the two mute cases need, and two write paths with different capabilities is the mirror
  problem in miniature. `dragHooks` and `useAttachSliderCallback` still call it; both go in
  Phase 3, and the file goes with them.
- **`PlayerStoreProvider` grew an optional `store` prop.** The harness has to mount a
  component against a store with a fake attached, and the context object stays private, so
  the provider is the seam. Read once through `useState`, so the value identity is exactly as
  stable as a created store's.
- **The volume thumb no longer snaps to zero while muted.** Deleting the `areNumbersClose`
  mute rule from `useHandleVolumeChange` was listed as a deletion, not a behaviour change,
  but it had a visible effect: the thumb used to jump to 0 on mute and back on unmute. It now
  stays where it is, which is what Phase 3's volume mode does anyway once the slider reads
  the `volume` atom directly.

One regression this phase leaves for Phase 3 to close: **a drag to zero erodes
`lastAudibleVolume`.** Every `volumechange` the drag passes through is a new "last audible
volume", so unmuting after a drag restores the last non-zero sample — measured at 0.04 from a
drag that started at 0.8 — where the `dataset` stash it replaced restored the pre-drag
volume. The E2E row asserts only "audible again" until then. Phase 3 fixes it with the
volume-drag pin, in `useSlider`, which is the first thing that knows a drag is in progress;
the sync layer still must not.

### Phase 3 — Retire the callback bus, unify the sliders — **landed**

The big one. These die together — do not try to split them.

- Delete `AudioElement/AudioContext.ts`, `AudioContextProvider.tsx`,
  `audioElementHooks.ts`, `useAudioElement.ts`, `AudioElement.tsx`'s handler gate, and
  `Slider/useAttachSliderCallback.ts`.
- Delete all three slider stacks: `Timeline{Context,Provider}` + `timelineReducer`,
  `Volume{Context,Provider}` + `volumeReducer`, `PlaybackRate{Context,Provider}` +
  `playbackRateReducer`.
- Add `Slider/useSlider.ts` and `Slider/sliderModes.ts`. `useSlider` takes
  `{ mode, value, min, max, step, orientation, onCommit }`, owns drag and geometry, and
  returns the `SliderContext` value: display value, ref callback, handlers and aria
  attributes. `Timeline`, `Volume` and `PlaybackRateSlider` become thin configuration over
  it.
- Separate commits, in this order: `useSlider` and its tests → migrate the three wrappers →
  `offsetFromMiddle` fix → vertical inversion from `orientation` → per-mode arrow keys → the
  volume-drag pin → `onEnded` policy handler.
- **Per-mode arrow keys.** All three thumbs currently share the global key map, so
  Left/Right seeks and Up/Down changes volume on *every* slider, while the rate slider
  responds only to `<` `>` `[` `]` — its `role="slider"` ignores arrow keys entirely. Each
  mode gets arrow keys that adjust its own value; the global shortcuts stay available
  elsewhere. This is the other half of the Phase 0 accessibility fix, and it needs the mode
  table to exist.
- **The volume-drag pin.** `lastAudibleVolume` stops tracking the values a drag passes
  through, so unmuting after a drag to zero restores the pre-drag volume rather than the last
  non-zero sample — see *A volume drag pins the memory* in section 3 for the mechanism. This
  is a Phase 2 regression against the `dataset` stash it replaced, not a new feature: the
  stash captured the pre-drag volume and the atom did not. It lands here rather than in
  Phase 2 because the pin has to be released on drag end *and* on pointer cancel, and
  `useSlider` is the first thing that owns both. Like the `offsetFromMiddle` fix, it flips an
  E2E assertion — `Volume/mute`'s last row goes from "audible again" to the pre-drag value —
  so the change cannot pass silently.
- **`onEnded`** becomes `send({ type: "SET_TIME_TO_START" })` on the `<audio>` element,
  replacing `handleEnded`'s `UPDATE_UI_VALUE value: 0` push. Visually identical, and element
  and UI stop disagreeing.
- `useSlider` is the only genuinely new logic with no existing test to inherit. Its jsdom
  test file lands before the wrappers are migrated, not after.
- Tests removed: ~10 files under `testJSDom/Slider`, `testJSDom/Timeline`,
  `testJSDom/Volume`, `testJSDom/PlaybackRate`.

*Verify:* the whole E2E suite, including everything Phase 0 added.

#### What landed, in four commits rather than seven

`useSlider` and the mode table → migrate the wrappers and delete the bus → vertical
inversion → the volume-drag pin. Three of the planned commits collapsed into the second,
for one reason each:

- **`offsetFromMiddle` and the per-mode arrow keys are intrinsic to the hook.** There is no
  version of `useSlider` that reproduces the old per-mode inconsistency without deliberately
  reintroducing it, so they could not be staged after the migration. Both still flipped their
  E2E assertions in that commit, which is what the assertions were for.
- **`onEnded` had to land with the bus.** The push it replaces lives in `audioElementHooks`,
  which the migration deletes; staging it later would have left three commits where a finished
  track leaves the thumb at the end.

The vertical inversion and the pin stayed separate, and each flipped an assertion written
before it.

#### Four deviations

- **Commits carry a value, not geometry.** `useSlider` sends `CHANGE_VALUE`, so the value is
  computed once where the geometry lives, and the volume mute coupling is one rule in
  `handleSideEffect` rather than one per gesture — click, drag and release used to reach it
  three different ways, and after Phase 2 the click path fought itself: `SET_SLIDER_VALUE`
  wrote `volume: 0` and the `UNMUTE` that followed restored the old volume, undoing the
  click. **Consequence:** `SET_SLIDER_VALUE`, `DRAG` and `DRAG_END` are no longer dispatched
  anywhere in `src/`. They still work and are still tested, and they are still in the
  published `SideEffectAction` union — a decision for Phase 6, since a `SliderData`-carrying
  action is not something a `customKeyboardShortcuts` map can sensibly construct.
- **The pin suppresses; it never writes.** The plan had `DRAG_START` write
  `lastAudibleVolume` from `el.volume` and then hold. Writing turned out to be unnecessary —
  the pre-grab volume is already in the memory, because the last `volumechange` put it there
  and a grab unmutes before it holds — and skipping the write keeps the projection invariant
  literally true rather than nearly true.
- **Most of Phase 4 came with Phase 3.** `useTimeDisplay` read the element through
  `AudioContext`, which this phase deletes, so it had to move to the store now: `elapsed` is
  `currentSecond`, `remaining` is `duration - currentSecond` derived in render, and the 1 Hz
  `setInterval` racing a 4 Hz event source is gone. The timeline's `aria-valuenow` is
  quantized to whole seconds in the same stroke, since `useSlider`'s two-value contract makes
  it free. What is left of Phase 4 is the CSS transition on the progress element.
- **`getClientXY` survived** rather than being duplicated inside `useSlider`: its event type
  widened to anything carrying a pointer position, React-synthetic or native, so one helper
  serves the handlers and the window listeners.

#### Two things that cost a debugging round

- **jsdom has no `PointerEvent`.** `fireEvent.pointerDown(element, { clientX })` silently
  drops the coordinates, and a slider driven that way computes `NaN`. `MouseEvent` carries
  them and both React's root listener and a window listener key off the type string, so
  `pointerEventAt` in `testUtils` builds one.
- **jsdom gives every element a zero-sized rect**, so `stubElementRects` patches
  `Element.prototype.getBoundingClientRect` for the duration of a test. The measurement is
  the one thing about a slider a jsdom test cannot observe for real.

### Phase 4 — `TimeDisplay` and the aria surface — **landed with Phase 3, except the CSS transition**

Drop the 1-second `setInterval`. It was a 1 Hz clock racing a 4 Hz event source, and
`currentSecond` *is* the 1 Hz clock, so it cannot drift. `Time.Elapsed`, `Time.Remaining`
and the timeline's aria attributes subscribe to `currentSecond`; `remaining` becomes
`duration - currentSecond`, derived in render, so the precedence bug cannot return.

Quantize the timeline's `aria-valuenow` to whole seconds too. It is currently a raw float
changing 4×/sec at a precision no assistive tech can use, while `aria-valuetext` changes
1×/sec — the two disagree about resolution.

Only the progress element stays on `currentTime`, at `timeupdate` rate, with a CSS
transition to smooth it. If that ever looks bad, write the transform to a CSS custom
property via ref — that option stays available precisely because the aria path is a
different subscription.

rAF into React is ruled out: it would rewrite `aria-valuenow` and `aria-valuetext` on the
`role="slider"` node 60 times a second. Assistive technology reads that node through the
accessibility tree — a virtual cursor parked on it, or a live-region-adjacent
announcement — so the churn is a problem whether or not the element has focus. At 4 Hz it
is borderline; at 60 Hz it is unusable. Not a CPU trade.

### Phase 5 — Strip the memo layer — **measured; strip in progress**

Delete the `memo` / `useMemo` / `useCallback` layer **unconditionally**, then add back only
what a measurement demands. Profile-then-prune biases toward keeping, and the residue is
how this layer formed in the first place.

Measurement: React DevTools Profiler, one 10-second playback trace and one full timeline
drag. Pass mark:

- during playback, only the progress element and `Time.*` commit
- during a drag, only the subcomponents of the slider being dragged commit

Anything else committing is a finding about a subscription that is too broad — and the fix
is to narrow the subscription, not to memoise the render. A `memo` there would hide exactly
what this refactor exists to remove. The one candidate for a genuine `useMemo` is the
per-slider `SliderContext` value, which churns at pointermove rate during a drag; add it
only if the drag trace shows it mattering.

#### How the traces were captured

`pnpm` is **not on PATH** on this machine; only `node`, `npm`, `npx`. `npm run dev` is
`tsup --watch`, not the demo. The demo is `npx vite dev` (or `npm run vite`), served at
`http://localhost:5173`. React DevTools was opened as a browser extension next to the app,
Profiler tab, record → drive the interaction → stop → export JSON.

Two exports were taken and analysed with a throwaway Node script
(`scratchpad/analyse2.mjs`): commits by React lane, duration percentiles, total render time
as a share of wall clock, inter-commit gaps, per-component render counts with
`changeDescriptions` (context / `didHooksChange` / hook indices / props), `updaters`, and
the never-rendered list. **Gotcha for whoever re-runs it:** wall-clock `duration` and
`reactVersion` live at `data.timelineData[0]`, *not* `dataForRoots[0]` — reading the wrong
path silently yields nonsense percentages.

#### What the two traces said

**Playback (~10 s).** Only `DebugStore`, `TimelineRoot`, `Elapsed2` and `Remaining2`
committed, at 0.6–1.0 ms each. Nothing else. The playback pass mark is met.

**Timeline drag (3418 ms wall clock).**

- 349 of 353 commits on the **InputContinuous** lane — a genuine pointermove drag.
- Median inter-commit gap **7.0 ms** (~143 commits/s): the drag commits at pointer rate,
  uncoalesced. Median commit **0.5 ms**, max **1.8 ms**.
- Total render **205 ms of 3418 ms = 6.0 % of wall clock**, in a dev build. No rAF
  coalescing is warranted, and none should be added.
- `TimelineRoot` re-rendered on **`hooks: [7]` — the local drag state — on 351 of 353
  commits. Hook 0 (the `currentTime` subscription) fired exactly once in 3.4 s.** That is
  seek mode's `writesDuringDrag: false` proven in data: during a seek drag the store is
  silent, every commit is local state, there is no element→store→UI feedback loop, and the
  retain-until-changed rule is never even exercised.
- `Elapsed2` and `Remaining2` rendered **exactly once each** across 353 slider commits —
  the two-value aria contract insulating the 1 Hz clock from a 143 Hz gesture.
- **Both other sliders never re-rendered** (`VolumeContainer`, `VolumeProgress`,
  `VolumeBackground`, `PlaybackRateSliderRoot`, `PlaybackRateBackground`, `RateDisplay`),
  nor did any button, `Toggle2`, `Duration2`, `ErrorMessage`, `AudioElement2`,
  `PlayerConfigProvider2`. **42 of 57 components untouched** — per-slider context
  confinement works.
- Self time totalled 126.5 ms, of which `Debug` + `DebugStore` = **43.5 ms (34 %)** is the
  demo-only panel. Library-only work ≈ 83 ms of 3418 ms = **2.4 % of wall clock**.

Both traces meet the pass mark. The `SliderContext` `useMemo` candidate named above is
**not** warranted: the churn is real (143/s) but confined to one slider's own subtree, which
is exactly the subtree that has to re-render anyway.

#### The verdict: strip everything, add nothing back

`Elapsed2`, `Remaining2`, `Toggle2`, `Duration2`, `AudioElement2` and `PlayerConfigProvider2`
are all `memo()`, and in **both** traces every one of their parents sits in the
never-rendered list. **Not one `memo` prevented a single render in either trace.** The layer
is inert — precisely the residue the unconditional-delete rule exists to clear.

The two `memo`/`useMemo` on `PlayerConfigProvider` deserve their own note, because a trace
cannot reach them: the demo has no state above `AudioPlayer`, so the provider never renders.
They are still not worth keeping. `audioFiles` is an array prop and the documented usage
passes an inline literal, so on a consumer re-render the `memo` comparison fails and the
`useMemo` dependency changes — both bail and buy nothing. When they do bail the cost is
seven cheap components re-rendering, which is what React does by default. A memo that only
works if the consumer memoises their props is worse than none, because it hides the
requirement.

#### The carve-out: `useSlider`'s callbacks stay

The 12 `useCallback`s in `useSlider.ts` are **not** render memoization and must survive the
strip. `valueAt`, `commit`, `send` and `releaseAudibleVolume` are dependencies of the drag
effect — unstable identities would tear down and re-attach five window listeners on every
pointermove, which is the exact thing the design avoids. `measure` feeds the ResizeObserver
effect. `setSliderRef` is a ref callback: an unstable one detaches and re-attaches the node.
Leave them, and add a comment at the top of the file recording that they are
effect-dependency stability rather than a render optimisation, so the next strip does not
have to re-derive it.

The same reasoning keeps `AudioElement`'s `ref` callback. Its old comment justified it *by
reference to `memo`*, which is now gone; the real reason is that an unstable ref would
detach and re-attach the element — and therefore the store — on every render.

**Considered and rejected:** collapsing `SliderProvider`, a wrapper that only renders
`SliderContext.Provider` and costs one extra fiber per slider (8.0 ms across the drag
trace). It would require exporting the context object, which is the handle the null-guard
keeps private. Not worth it.

#### Work list

| File | Change | Status |
|---|---|---|
| `src/AudioElement/AudioElement.tsx` | unwrap `memo`; inline `handleEnded` (drop its `useCallback`); keep the `ref` `useCallback`, rewrite its comment | **done** |
| `src/Player/PlayerConfigContext.tsx` | unwrap `memo` (line 33); drop the `useMemo` (line 38) and build the context value inline | todo |
| `src/TimeDisplay/TimeDisplay.tsx` | unwrap the four `memo()`s — `Toggle` (16), `Elapsed` (54), `Remaining` (69), `Duration` (84); the exported `Time` type then loses `React.NamedExoticComponent` and needs plain `React.FC` members | todo |
| `src/Slider/SetSliderValue.tsx` | drop the `style` `useMemo` (line 24) | todo |
| `src/Slider/useSlider.ts` | **keep** all 12 `useCallback`s; add the comment recording why | todo |

Watch for: `React.NamedExoticComponent` appears in `TimeDisplay.tsx`'s exported `Time` type
and is the type `memo()` returns. Removing `memo` means that annotation has to change, and
`Time` is part of the public surface — `check-exports` and the API snapshot both see it.

Re-verify after the strip: 346 jsdom tests, 51 E2E tests, `type-check`, `lint`, `build`,
`check-exports`. `Debug.tsx` and `App.tsx` are covered by `tsconfig.app.json`, so a type
error there is a real failure, not demo noise.

### Phase 6 — Measure and reconcile

Rebuild, compare against section 6, re-run `check-exports`, update the README.

`Debug.tsx` and `App.tsx` read every context and are covered by `tsconfig.app.json`, so they
must migrate in lockstep with every phase or `pnpm type-check` fails CI. They are
tree-shaken out of `dist`, not out of the build.

#### Carried in, needing a decision

- **The CSS transition on the progress element** — the one piece of Phase 4 that did not
  land. The progress element still tracks `currentTime` at `timeupdate` rate (~4 Hz) with no
  smoothing.
- **Prune `SET_SLIDER_VALUE` / `DRAG` / `DRAG_END` from the published `SideEffectAction`
  union?** Nothing in `src/` dispatches them since Phase 3 retired the bus. Removing them is
  a breaking change to a public type, so it is the maintainer's call, not a cleanup.
- **The README claims "Caption/subtitle support"**, which appears to be untrue of the
  current code. Verify and either implement or drop the claim before the README rewrite.

## 5. Testing strategy

Unit-test what can be unit-tested; E2E for what cannot, plus every basic operation.

| Tier | Subject | Runs in CI |
|---|---|---|
| **unit** | `atom` / `useStore`; `syncFromElement(stub, atoms)`; `handleSideEffect` (all 22 actions); `calculateSliderValue` / `getOffset` / `formatTime`; the `SLIDER_MODES` table | yes |
| **jsdom component** | `useSlider` through a rendered `<Timeline>`; `PlayButton` / `MuteButton` / `Time` against a constructed store — set an atom, assert the DOM, no mocking | yes |
| **E2E** | real media events: drag semantics, mute round-trip, error recovery, and all basic operations | yes |

The store makes the middle tier cheaper than it is today: construct a store and set atoms
instead of mocking jsdom audio. `syncFromElement` absorbs most of what the deleted reducer
tests were really covering — element event in, state out, minus the bus.

## 6. Bundle figures

Source at baseline: 3,294 lines across 57 files in `src/`.

Measured, gzipped, minified, tree-shaken, React external:

| Consumer | 6 entries, no splitting | 6 entries, `splitting: true` |
|---|---|---|
| root import (`index`) | 6,007 B | 6,758 B |
| `timeline` + `volume` + `player` subpaths | 9,825 B | 5,932 B |

`splitting: true` was taken for correctness, at +751 B on the root import. Phase 0 reverts
it along with the subpaths, so the root import returns to ~6,007 B and the bug it was
defending against stops being possible. `sideEffects: false` then lets consumer bundlers
tree-shake the root entry.

Projection for the store work: roughly 1.2–1.5 KB gz of contexts, reducers and callback
plumbing removed, against ~200 B added for the hand-rolled primitive. A real reduction,
unlike the wash a store dependency would have produced. Still not the reason to do it.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Phase 3 is large and hard to bisect | Land Phases 0–2 first; keep Phase 3 on its own branch; commit `useSlider`, the three migrations and each behaviour fix separately |
| E2E cannot localise a Phase 3 failure — "the thumb didn't move" does not say whether the sync layer, the mode table or the geometry is wrong | `syncFromElement` and `useSlider` carry their own unit suites, so each layer fails independently of the others |
| ~15 of 50 unit test files lose their subject | Expected. Phase 0 invests only in survivors; `syncFromElement` absorbs the reducer coverage; components get behavioural tests against a constructed store |
| Unifying three divergent sliders silently changes behaviour | The differences are two named axes, not accidents — see the mode table. Each fix is its own commit, and Phase 0's E2E specs pin the current semantics first |
| Writing to a projection atom outside the sync layer | Type projections as `{ get, subscribe }`; keep `set` in the factory closure |
| `getSnapshot` returning fresh objects, causing an infinite loop | Atoms hold primitives only; derive objects in render |
| The hand-rolled primitive is wrong | It is ~20 lines with no cache and no state machine, and it gets its own unit suite in Phase 1. `computed` and `onMount` — the two pieces with genuinely subtle failure modes — are out of scope by design |
| `Debug.tsx` / `App.tsx` break `type-check` mid-phase | Migrate them in lockstep; they read every context |

## 8. Recorded, out of scope

Found during review, deliberately not part of this refactor:

- **`<Seek amount={-10}>` routes through `SET_TIME_FORWARD`** with a negative value and
  relies on the browser clamping negative `currentTime`. `SET_TIME_BACKWARD` exists and is
  unused.
- **`CHANGE_VALUE` is dispatched from nowhere in `src/`.** It is reachable only through the
  public `customKeyboardShortcuts` map, and it is the one write path that sets `volume = 0`
  outright.
- **Live streams are unsupported.** An infinite `duration` atom becomes the timeline's
  `max`, so `getOffset` divides by `Infinity` and pins the thumb at zero, and
  `aria-valuemax` serialises as `"Infinity"`. Support means an unbounded-timeline mode, and
  it arrives as one unit: the mode, a `"--:--"` token for unknown duration, and the aria
  handling. Phase 0 only stops `formatTime` emitting `"Infinity:NaN"`; it deliberately does
  not ship the placeholder ahead of the mode that gives it meaning.
