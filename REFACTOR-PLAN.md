# Refactor Plan: External Store Architecture

Status: agreed after design review 2026-08-21, not started. Bundle figures measured
2026-08-21 against commit `b4df69c`.

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
| Listener attachment | **eager, one effect keyed on the element** | Lazy per-atom mounting re-creates the render-timing coupling it was meant to remove, and a write to an unsubscribed atom costs nothing. |
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
inside the factory closure. Break this rule and the mirror problem grows straight back.

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

`Object.is`, not `===`, and it matters: `el.duration` is `NaN` before metadata, and
`NaN !== NaN`, so `===` would notify on every `durationchange` while the duration is
unknown. React compares snapshots with `Object.is` and would not re-render, so the cost is
wasted notification plus two comparisons that disagree with each other. Matching React
costs nothing.

### Store shape

```ts
export function createPlayerStore() {
  // projections of the element -- written only by syncFromElement
  const element           = atom<HTMLAudioElement | null>(null);
  const currentTime       = atom(0);   // ~4 Hz, pixels only
  const currentSecond     = atom(0);   //  1 Hz, text and aria
  const duration          = atom(0);
  const volume            = atom(1);
  const muted             = atom(false);
  const lastAudibleVolume = atom(1);   // replaces el.dataset.dragStartVolume
  const rate              = atom(1);
  const paused            = atom(true);
  const errored           = atom(false);
  const hasMetadata       = atom(false);

  // UI state, genuinely shared, writable
  const timeDisplay = atom<"elapsed" | "remaining">("elapsed");

  const send = (action: SideEffectAction) => handleSideEffect(action, element.get());

  return { /* readonly projections */, timeDisplay, send };
}
```

Derived values are computed in render, never stored:

```ts
function usePlayerState() {
  const errored     = useStore(store.errored);
  const hasMetadata = useStore(store.hasMetadata);
  const paused      = useStore(store.paused);
  return errored ? "error" : !hasMetadata ? "loading" : paused ? "paused" : "playing";
}
```

Three subscriptions instead of one, returning a primitive — so the `getSnapshot` hazard
cannot apply, and there is no cache to invalidate.

### The sync layer

One effect in the provider, keyed on the element, attaching every listener. It re-runs when
the element changes, so there is no ordering assumption anywhere.

| Event | Writes |
|---|---|
| `timeupdate` | `currentTime`, `currentSecond` |
| **`seeked`** | `currentTime`, `currentSecond` |
| `loadedmetadata` | `duration`, `hasMetadata` |
| `durationchange` | `duration` |
| `volumechange` | `volume`, `muted`, and `lastAudibleVolume` when audible |
| `ratechange` | `rate` |
| `play` / `pause` / `ended` | `paused` |
| `error` | `errored` |
| `emptied` / `loadstart` | resets `errored` and `hasMetadata` |

**`seeked` is not optional.** It is the fast echo path after any write to
`el.currentTime` — drag release, click-to-seek, and every keyboard seek — and
`AudioElement.tsx:47` wires it today (`onSeeked={handleTimeUpdate}`). Without it the atom
carries a stale time until the next `timeupdate`, up to ~250 ms. See the retain-until-changed
rule under *The sliders*, which depends on it.

`duration` is normalized on write: `Number.isFinite(el.duration) ? el.duration : 0`. It is
`NaN` before metadata and `Infinity` for live streams, and `formatTime` renders those as
`"NaN:NaN"` and `"Infinity:NaN"`. Today's `?? 1` fallback does not catch either, so this is
a pre-existing bug that the sync layer is simply the right place to fix. Live streams then
read as `duration: 0`, which is honest — a seek bar over an unbounded stream is meaningless
— and gating UI on `hasMetadata && duration > 0` covers it. Full live-stream support is out
of scope.

`syncFromElement(el, atoms)` takes anything with `addEventListener`, so it is directly
unit-testable against a stub — no jsdom audio, no rendering. That is the primary gate on
Phase 1 and the replacement for most of the reducer tests Phases 2–3 delete.

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

### What lives where

| State | Where it goes | Why |
|---|---|---|
| `currentTime`, `currentSecond`, `duration`, `volume`, `muted`, `lastAudibleVolume`, `rate`, `paused`, `errored`, `hasMetadata` | store atom | projections of the element |
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

### Phase 0 — Public surface, known bugs, and coverage

Lands first: it changes the public surface, and it is easier to refactor against the
surface you intend to keep. Nothing here depends on the store.

**Entry points**

- [ ] Single entry. Drop the five subpath exports and revert `splitting: true`. Six entries
      were the cause of the duplicate-context bug — each entry shipped its own
      `createContext` calls, so mixing `react-audio-player/timeline` with
      `react-audio-player/player` produced two distinct `AudioContext` objects and a
      silently dead timeline, with no error, because `useContext` returns the default. One
      entry makes it unrepresentable, which matters because Phase 1 adds a context.
- [ ] Add `"sideEffects": false` to `package.json`. A consumer importing only `Volume` from
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

- [ ] `PlayButton`, `MuteButton`, `Seek`, `Error` and `PlaybackRateSlider` are documented in
      the README but never exported — the README's own Basic Usage example does not run.
- [ ] Rename `Error` to `ErrorMessage`. `import { Error }` shadows the global for the rest
      of that consumer module.
- [ ] Add `PlaybackRateSlider.Progress`. It is the only slider without one, and that
      asymmetry is a real API gap. The slider itself works — stepping is functional via
      `handleSideEffect`'s `DRAG` case, so the README roadmap line "Finish stepped playback
      rate slider" is stale.
- [ ] Export `KeyToActionMap` and `SideEffectAction`. `customKeyboardShortcuts` is typed
      public API and consumers currently cannot name the type they are required to
      construct.
- [ ] Delete `Volume/volumeHooks.ts` and its test — dead code.

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

- [ ] `TimeDisplay/useTimeDisplay.ts:19` — `duration ?? 0 - currentTime` parses as
      `duration ?? (0 - currentTime)`, so `remaining` is just the duration, constant.
      `<Time.Remaining>` renders the negated track length and never counts down. Present at
      both call sites; no test asserts the value; `<Time.Remaining />` is commented out in
      `App.tsx`.
- [ ] `AudioElement/handleSideEffect.ts:139` — `action.step || 0.25`, so
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

- [ ] vertical **volume** progress at `value: 0.25` and `0.8`
- [ ] vertical **non-volume** progress at `value: 0.25` and `0.8`

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

- [ ] Extend `getAudioState` in `testE2E/test-utils.ts` with `volume`, `muted` and
      `playbackRate`; add the volume, rate and mute labels to the `labels` map.
- [ ] Add a `?src=` URL param to `App.tsx`. It already reads `?orientation=` via
      `useUrlParams`, so this is two lines, and it lets one spec swap bad → good in a single
      page session — which is what tests *recovery* rather than just the error state.
- [ ] Add a `?players=2` URL param to `App.tsx`, rendering two independent `<AudioPlayer>`s.

| Spec | Test | Notes |
|---|---|---|
| `Volume/volume-drag` | drag thumb to 25% → `el.volume ≈ 0.25` | |
| | drag thumb to zero → `muted` | pins the `DRAG_END` mute-at-zero rule |
| | grab the thumb off-centre → value **jumps** by the grab offset | pins today's bug, so Phase 3's fix has to change it deliberately |
| `Volume/volume-click` | click track at 25% → `el.volume ≈ 0.25` | |
| | vertical (`?orientation=vertical`): drag up raises volume | pins the inversion end-to-end |
| `Volume/mute` | mute → `aria-pressed="true"`, `el.muted` | |
| | drag to zero, mute, unmute → volume is audible again | the `dataset` path, which works today |
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
| | then swap to a good src → `ErrorMessage` gone, controls enabled | the `errored` reset |
| `a11y/slider-semantics` | Tab reaches the element with `role="slider"` | fails today |
| | it exposes `aria-valuenow` / `aria-valuetext` | |
| | arrow keys on it change the value | |

Play/pause, timeline drag, click-to-seek and the seek keys are already covered by the
existing 15 tests, so the basic-operations requirement is met once the rows above land.

**Deliberately not E2E: the loading state.** `useIsDisabled` gates six components on
`playerState === "loading"`, but loading is transient and racy in a real browser. It belongs
in the jsdom tier in Phase 2 — construct a store, leave `hasMetadata` false, assert the
buttons are disabled. Deterministic there, flaky here, and it is exactly the tier the store
makes cheap.

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

### Phase 1 — Store, sync layer, provider (no consumers)

Add `src/store/*`. Wrap `AudioPlayer` in `PlayerStoreProvider`, created once via
`useState(() => createPlayerStore())` so the context value never changes. Attach the element
to the `element` atom via the `<audio>` ref callback. Nothing reads the store yet.

*Verify:* **not** "build passes, zero behaviour change" — that gate cannot fail. From here
to Phase 3 every media event is handled twice, by the sync layer and by the old bus; the
atoms are unread, so a wrong `syncFromElement` is invisible and would surface mid-Phase-2
among fifty component migrations. The real gates:

- the `syncFromElement` unit suite, written exhaustively here rather than incrementally —
  one test per row of the sync-layer table, asserting every atom that event feeds, plus the
  `currentSecond` bail-out and the `errored` reset
- the `atom` / `useStore` suite: subscribe, notify, unsubscribe, identity bail-out, multiple
  subscribers
- atom values rendered in the `Debug` view (already wired into `App.tsx`) and visibly
  agreeing with existing reducer state during playback — the one moment where seeing both
  side by side is worth anything

### Phase 2 — Retire `PlayerContext`

Highest value, lowest risk: every field of `playerReducer` is either a command or a
derivation.

- Delete `Player/PlayerContext.ts`, `Player/PlayerProvider.tsx`, `Player/playerReducer.ts`.
- Migrate `PlayButton`, `MuteButton`, `ErrorMessage`, `Seek`, `Shared/useIsDisabled`,
  `TimeDisplay`, `PlaybackRate/SetPlaybackRate` (`RateDisplay`, `useIsCurrent`),
  `PlaybackRate/ChangePlaybackRate` and `KeyboardControls/handleMediaKeys`.
- `ChangePlaybackRate` must subscribe to the `rate` atom. It currently reads the element ref
  during render and is saved only by the `PlayerContext` subscription this phase deletes.
- Replace `el.dataset.dragStartVolume` with `lastAudibleVolume`.
- `AudioElement.tsx` and `audioElementHooks.ts` are **half-emptied here and deleted in
  Phase 3** — their `PlayerContext` dispatches go, because the sync layer already covers
  those events, while their timeline-bus pushes stay. Expected, not drift.
- Tests removed: `playerReducer.test`, `PlayerProvider.test`.

Phase 2 comes before Phase 3 for a specific reason: `audioElementHooks` feeds both systems.
Killing the bus first would mean writing sync-layer-to-`PlayerContext` glue and then
deleting it.

*Verify:* play/pause, mute round-trip, seek, rate and error-recovery E2E specs.

### Phase 3 — Retire the callback bus, unify the sliders

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
  `offsetFromMiddle` fix → vertical inversion from `orientation` → per-mode arrow keys →
  `onEnded` policy handler.
- **Per-mode arrow keys.** All three thumbs currently share the global key map, so
  Left/Right seeks and Up/Down changes volume on *every* slider, while the rate slider
  responds only to `<` `>` `[` `]` — its `role="slider"` ignores arrow keys entirely. Each
  mode gets arrow keys that adjust its own value; the global shortcuts stay available
  elsewhere. This is the other half of the Phase 0 accessibility fix, and it needs the mode
  table to exist.
- **`onEnded`** becomes `send({ type: "SET_TIME_TO_START" })` on the `<audio>` element,
  replacing `handleEnded`'s `UPDATE_UI_VALUE value: 0` push. Visually identical, and element
  and UI stop disagreeing.
- `useSlider` is the only genuinely new logic with no existing test to inherit. Its jsdom
  test file lands before the wrappers are migrated, not after.
- Tests removed: ~10 files under `testJSDom/Slider`, `testJSDom/Timeline`,
  `testJSDom/Volume`, `testJSDom/PlaybackRate`.

*Verify:* the whole E2E suite, including everything Phase 0 added.

### Phase 4 — `TimeDisplay` and the aria surface

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

### Phase 5 — Strip the memo layer

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

### Phase 6 — Measure and reconcile

Rebuild, compare against section 6, re-run `check-exports`, update the README.

`Debug.tsx` and `App.tsx` read every context and are covered by `tsconfig.app.json`, so they
must migrate in lockstep with every phase or `pnpm type-check` fails CI. They are
tree-shaken out of `dist`, not out of the build.

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
