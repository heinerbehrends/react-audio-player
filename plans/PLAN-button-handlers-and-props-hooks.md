# Plan: compose the button handlers (S24), then expose props hooks (D1)

Two tickets, one sequence, one release. **S24** is breaking and **D1** is additive, but
both land before the first public beta — so there is no clock on either, and no window in
which S24's breaking change is visible to anyone. The order is a code dependency, not a
schedule.

## Why this order

S24 settles a question D1 cannot answer on its own: whether a props hook accepts the
consumer's handlers.

While `onClick` replaces, a hook has no honest option. A plain bag gives the consumer two
spellings and both are wrong — `<Button {...props} onClick={mine} />` breaks playback,
`<Button onClick={mine} {...props} />` means their handler never fires. Once the handlers
compose, the hook can take them and hand back one already-composed, already-gated
handler, and the footgun does not exist to document.

## Decisions already taken

Recorded here so they can be argued with, not so they can be assumed.

**`asChild` is refused.** Radix's merge rule is child-props-win, which inverts every lock
this library spreads last — `role="slider"`, `tabIndex={-1}`, `aria-hidden`, the
`aria-disabled` click gate. Implementing it means writing a Slot with the opposite rule:
a prop people believe they know, behaving differently, with no signal at the call site.
It also costs bundle size for everyone — `const Comp = asChild ? Slot : "button"` names
`Slot` unconditionally, so a `PlayButton`-only import ships the whole merge
implementation. That is a smaller replay of **P1-a**, which this project already paid to
fix.

**`render` is deferred, not refused.** Once the props bag is public, `render` is three
lines on top of it and purely additive. Build it if wrapper-component fatigue turns out to
be real; don't build it on speculation.

**Hooks are the foundation.** They add no bundle cost — the code already lives inside the
components, it only moves — and they touch no existing prop type.

**Display parts are out of scope.** `Progress`, `Background`, the three `<time>`
readouts, `ErrorMessage`, `RateDisplay`. `useAudioPlayer()` plus `formatTime` already
reaches them. `Progress`'s transform maths is the one genuine candidate, and **D5**
(hosting a waveform) is the ticket that should ask for it.

---

## Phase 1 — S24

### The change

The click gate and the media-key handler need the same fix, and both belong in one place.
`useDisabledButtonProps` becomes **`useComposedButtonProps`** and owns all three of the
props the library must control:

```ts
useComposedButtonProps(
  ours: ClickHandler,
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
  opts?: { requiresSeekable?: boolean },
): {
  "aria-disabled": true | undefined;
  onClick: ClickHandler | undefined;
  onKeyDown: KeyDownHandler;
};
```

It takes the consumer's whole props bag rather than a lone `onClick`, because it now
reads two handlers off it — and because that is the shape **Phase 2** needs, so the
signature does not change twice.

`onClick` composes instead of replacing:

```ts
onClick: isDisabled ? undefined : composeEventHandlers(props.onClick, ours);
```

**Keep the disabled branch exactly as it is.** While `aria-disabled`, neither handler
runs. That is the A5/A7 behaviour, and `loadingState.test.tsx`'s "does not activate while
unseekable, the consumer's handler included" must stay green with no edit. If that test
needs changing, the change is wrong.

`onKeyDown` is new to the hook. It calls `useHandleMediaKeys()` itself — `ours` was
identical in all six callers — and composes:

```ts
onKeyDown: composeEventHandlers(props.onKeyDown, handleMediaKeys);
```

`useHandleMediaKeys` returns `boolean` where `composeEventHandlers` types `ours` as
returning `void`. That is assignable, and React already ignores a handler's return value,
so nothing changes. Worth a comment so nobody "fixes" it.

### What the six components lose

`PlayButton`, `MuteButton`, `SeekButton`, `Time.Toggle`, `PlaybackRate.Set` and
`PlaybackRate.Change` each **delete** their `onKeyDown={handleMediaKeys}` line and their
`useHandleMediaKeys` import. The existing `{...disabled}` spread becomes `{...composed}`
and carries the keydown too, so the comment already above it — "Last, so the gate cannot
be spread away" — covers both handlers without an edit beyond the noun.

Nothing is hand-written six times, and a seventh button inherits the merge rule by
calling the hook.

`aria-label` stays **before** the spread on every one of them. It is the only way to
localise a control (**A15**), and that is deliberate. `type="button"` stays before the
spread too: it is not a lock the library depends on, and a button inside a form is the
consumer's business.

### The gate covers activation, not the shortcuts

While `aria-disabled` the click is blocked, including the consumer's own. The media
shortcuts still fire. **That is deliberate, and the rewritten JSDoc must say so
positively** rather than leave it as an artefact of where the handler used to be
attached.

The reason: the keymap is player-wide. `p` toggles play from the mute button. Gating it
on _this_ button's disabled state would mean `p` working from five buttons and not from
`SeekButton` whenever the track is unseekable — and seekability has nothing to do with
play/pause.

### `preventDefault()` is a sharper tool on keydown than on click

`composeEventHandlers` makes `preventDefault()` the consumer's opt-out. On a `<button>`
that is free for `onClick` and **not** free for `onKeyDown`: it is exactly how you stop
`Enter` from activating a button. A consumer who calls it unconditionally silently loses
keyboard activation.

This codebase already knows that trap — it is why `handleMediaKeys` deliberately omits
`Space`. Two consequences:

- The JSDoc warns about it: `preventDefault()` in your `onKeyDown` also stops `Enter` and
  `Space` from pressing the button, so scope it to the key you are handling.
- It is **not** advertised as the way to turn the shortcuts off. That is the next
  section's job.

### Restore the escape hatch: let `customKeyboardShortcuts` unbind

Today `onKeyDown={mine}` replaces the library's handler, which is the only way to turn the
media keys off. S24 removes it, and nothing else can express it —
`customKeyboardShortcuts` merges over the defaults and its values are actions.

The runtime already supports the fix. `handleMediaKeys` does
`const action = keyToActionMap[event.key]; if (!action) return false;` — so `{ p: null }`
spreads over the default, falls through with no `preventDefault()` and no
`stopPropagation()`, and the key reaches the browser. Only the type forbids it.

Widen `KeyToActionMap` to `KeyboardAction | null`, document the unbind, test it. It is
player-wide rather than per-button, which is coarser than what it replaces and is the
right granularity anyway: `p` working on one button and not its neighbour is a bug report,
not a feature.

### Move `composeEventHandlers` to `src/Shared/`

It lives in `src/Slider/` today and `src/Shared/useComposedButtonProps.ts` is about to
import it. One shared module reaching into a feature directory is backwards — a worse
smell than six components doing it, not a smaller one. `git mv` it to
`src/Shared/composeEventHandlers.ts` and update the two existing import sites
(`SliderControl.tsx`, `SliderThumb.tsx`).

`TASK-SPLIT-SHARED-FUNCTIONS` argues that "Shared" names provenance rather than content,
and that objection stands — but it is an argument for renaming the directory, which is
that task's job and not this one's. Do not pre-empt it here.

Keep the JSDoc intact. It records why the ordering is consumer-first and what
`preventDefault()` buys, which is the reasoning S24 extends to the buttons.

### Close the seek hole, at the action

Last step of this phase, because the JSDoc above should describe the codebase rather than
excuse it.

`useIsSeekable()` is `false` on a live stream — `finite()` in `syncFromElement` maps
`Infinity` to `0` — so `SeekButton` is correctly `aria-disabled` and its click is gated.
But `SET_TIME_FORWARD` reads `audioElement.duration` directly, and
`Math.min(currentTime + 5, Infinity)` is finite, so `writeTime`'s `Number.isFinite` guard
passes and it seeks anyway. Reachable with `ArrowRight` or `l` from any of the six
buttons.

Before metadata it is safe by accident: `duration` is `NaN`, `Math.min` returns `NaN`, the
guard bails.

Guard the duration, not just the computed value, in `SET_TIME_FORWARD` and
`SET_TIME_BACKWARD`. That closes it for every entry point rather than for the one button
whose gate happens to notice.

### Tests

The behaviour now lives in one hook and the wiring in six components, so the tests split
the same way.

**The hook — `renderHook`, no components.** New file,
`testJSDom/Shared/useComposedButtonProps.test.tsx`:

1. the consumer's `onClick` runs, and so does the library's
2. the consumer's `preventDefault()` stops the library's `onClick`
3. the consumer's `onKeyDown` runs, and so do the media keys
4. while `aria-disabled`: `onClick` is gone, `onKeyDown` still fires — the decision above,
   pinned so nobody "fixes" it later

**The wiring — six rows, one table.** A correct hook does not prove `PlayButton` calls it
or spreads it last, which is the actual failure mode.

`p` sends `TOGGLE_PLAY` from all six, because the keymap is player-wide, so the keydown
half is uniform: attach a spy, press `p`, assert the spy fired _and_ `element.play` was
called. The click half is not, so each row carries its own one-line assertion:

```ts
const buttons = [
  {
    name: "PlayButton",
    render: (p) => <PlayButton {...p}>x</PlayButton>,
    expectAction: (el) => expect(el.play).toHaveBeenCalled(),
  },
  // …five more
];
```

**Two more:**

- `Enter` still activates the button with a consumer `onKeyDown` attached. There is no
  test anywhere today that `Enter` or `Space` activates any of the six — the only keyboard
  test is `p` on `PlayButton` (`PlayButton.test.tsx:82`).
- `{ p: null }` unbinds and lets the key through. Goes in the existing
  `testJSDom/KeyboardControls/handleMediaKeys.test.tsx`.

**And the inversion.** `loadingState.test.tsx:207-221`, "runs the consumer's handler **in
place of** ours once seekable" becomes "**alongside**": `theirs === 1` _and_
`element.currentTime === 10`. It stays in that file — it is about the seek gate releasing.
Split the comment so a failure says which half broke, because it now asserts two
independent things.

### Comments and docs

Rewrite the hook's JSDoc. "`theirs` still replaces `ours`, as it did before the gate
existed" becomes false, and it is the sentence a reader will trust. It also has three new
things to say: the gate covers activation and not the shortcuts, `preventDefault()` on
keydown costs `Enter`, and `{ key: null }` is how you turn a shortcut off.

`SliderControl`'s JSDoc already says the thing that is about to become true of the buttons
— "your `onPointerDown` and `onKeyDown` run alongside the library's rather than replacing
them." Reuse the sentence; the buttons are joining the slider's rule, not inventing one.

Grep the README for any claim about `onClick`/`onKeyDown` on the buttons and fix what the
change falsifies.

---

## Phase 2 — the six button hooks (D1)

### Shape

Each hook takes the consumer's props and returns the finished bag. The props
parameter is **generic**, not a plain `React.ButtonHTMLAttributes`:

```ts
type ButtonBagBase = ComposedButtonProps & {
  type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  "aria-label": string;
};

type ButtonPropsBag<P> = Omit<P, keyof ButtonBagBase> & ButtonBagBase;

export function usePlayButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): ButtonPropsBag<P>;
```

A plain `ButtonHTMLAttributes` parameter **rejects `data-*`**. JSX has a special
exemption for those attributes; a function argument does not:

```
error TS2353: Object literal may only specify known properties,
and '"data-testid"' does not exist in type 'ButtonHTMLAttributes<HTMLButtonElement>'.
```

Answering that with "put `data-testid` on the element instead" is the wrong habit
to teach — it is the after-the-spread placement that produces
`<button {...usePlayButtonProps()} onKeyDown={mine} />`, the footgun two sections
down. And `data-*` is not a rare case in a library that means to push styling onto
`data-state` (**S9**). The generic also keeps the consumer's own keys in the
return type, so `bag["data-testid"]` still reads as `string`.

`type` and `aria-label` are in `ButtonBagBase` because they are always present in
the result — from the consumer if they passed one, from the library otherwise. A
consumer labelling their own element can read `bag["aria-label"]` rather than
re-deriving it, which is one of the reasons to want a props hook at all.

Expect the return statement to need one assertion: TypeScript will not prove that
a spread of a generic `P` produces `ButtonPropsBag<P>`. Comment it rather than
widening the signature to hide it.

### The three tiers move inside the hook

The merge order the six components spell out in JSX today moves into the hook,
unchanged — defaults, then the consumer, then the locks:

```ts
export function usePlayButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(props?: P): ButtonPropsBag<P> {
  const ariaLabel = useAriaLabel();
  const handleClick = useHandleClick();
  const composed = useComposedButtonProps(handleClick, props ?? {});

  return {
    type: "button",
    "aria-label": ariaLabel,
    ...props,
    ...composed,
  } as ButtonPropsBag<P>;
}
```

The component then becomes a one-liner over its own hook:

```jsx
function PlayButtonComponent({ children, ...props }: PlayButtonProps) {
  return <button {...usePlayButtonProps(props)}>{children}</button>;
}
```

That is the property worth having: the component and the hook **cannot drift**,
because the component has no behaviour left of its own. Merge order is defined
once, in the hook, and both callers get it.

`props ?? {}` is not decoration. `useComposedButtonProps` takes `props` as a
**required** parameter and reads `props.onClick` off it, so a hook that forwards
an undefined `props` throws — on the one call shape the components never use. See
the tests below.

Each of the six is thin, because `useComposedButtonProps` already owns the merge
rule — the hook adds its own label and action and spreads the composed bag last.

### The six, and the rule that names them

The value a hook needs — `amount`, `rate` — goes **in front**, as its own
argument, not inside the props object. Inside the object it becomes a key of `P`
and flows into the returned bag, and React passes unrecognised lowercase
attributes through to the DOM: `<button amount="-10">` in the page source. The
hook would have to strip it at runtime _and_ `Omit` it from the type, and
forgetting either is invisible in tests. A leading argument has nothing to strip,
and cannot be forgotten.

Names flatten the public component name, so a consumer reading
`<PlaybackRate.Set>` in their own code can work out the hook without opening the
docs. `useSetRateProps` and `useChangeRateProps` are dropped: they shorten
"playback rate" to "Rate", which nothing else in the public surface does —
`PlaybackRateSlider` is not `RateSlider`.

| Hook                                         | What only the library knows                              |
| -------------------------------------------- | -------------------------------------------------------- |
| `usePlayButtonProps(props?)`                 | The four-name label map (A4)                             |
| `useMuteButtonProps(props?)`                 | "Mute"/"Unmute", and deliberately no `aria-pressed` (A4) |
| `useSeekButtonProps(amount, props?)`         | Label follows the sign; also gates on `isSeekable`       |
| `useTimeToggleProps(props?)`                 | "Show time elapsed"/"Show time remaining"                |
| `usePlaybackRateSetProps(rate, props?)`      | `aria-pressed` on every button, false ones included (A9) |
| `usePlaybackRateChangeProps(amount, props?)` | "Increase/Decrease playback rate by {n}x"                |

Phase 3's `useSliderControlProps` / `useSliderThumbProps` already obey the same
rule.

### `<button>` hosts only

The bag is a plain object, so nothing stops `<a {...usePlayButtonProps()}>` or a
`<div>`. **That is not supported, and the JSDoc says so in one line**: spread it
onto a `<button>`, or onto a component that renders one.

Three things in the bag are button-specific. `type="button"` is a real attribute
on `<a>`, where it names the MIME type of the linked resource — so an `<a>` host
renders a valid attribute asserting something false. `handleMediaKeys`
deliberately omits `Space`, because a real `<button>` already activates on it; on
`<div role="button">` that careful omission becomes a dead key the consumer has to
implement. And the bag carries no `role` and no `tabIndex`, so a `<div>` host is
unreachable by keyboard until the consumer adds both.

Supporting any element means owning keyboard activation, which makes this a
headless-button primitive rather than a props hook, and re-opens the `Space`
decision `handleMediaKeys` settled on purpose. It is also more than **D1** asked
for: its own sentence is "`PlayButton` renders a `<button>` they already have a
styled version of."

This holds for all eight hooks. `SliderControl` renders a `<button>` too
(`type="button"`, `role="slider"`, `tabIndex={0}`), so the rule is uniform across
Phase 2 and Phase 3 rather than a button-only exception.

### The footgun this phase adds

Once the bag is public, the consumer does their own spreading — and
`<button {...usePlayButtonProps()} onKeyDown={mine} />` puts their handler back on
top of the composed one, outside the hook's reach. Phase 1 has no equivalent,
because the library controls the JSX. Phase 4's doc scoping is the answer; note it
here so it is not rediscovered as a bug.

### `data-state` and `data-disabled` are out of scope

The open question was whether putting them in the bags closes **S9**'s open half
for free. It does not, and this is a scope increase rather than a side effect.

`data-state` is free for only three of the six — `PlayButton` already calls
`usePlayerState()`, `MuteButton` `useVolumeState()`, `Time.Toggle` reads
`timeDisplay` — and `PlaybackRate.Set` has `isCurrent` already. `SeekButton` and
`PlaybackRate.Change` have no state of their own, so the result is four buttons
carrying the attribute and two permanently without it.

`data-disabled` is not free at all: `useComposedButtonProps` computes `isDisabled`
but does not return it, so this changes a Phase 1 type and puts a new attribute in
the rendered DOM of all six components, which E2E can see.

And **S9**'s open half is mostly not about buttons. It names slider `data-state`
(idle/dragging) and `data-orientation`, and singles out drag state as reachable
from neither CSS nor JS with **no workaround**. That is `SliderContext`, so Phase
3 at the earliest. No amount of button work closes the ticket.

Do the whole attribute vocabulary as one pass after Phase 3 — buttons and sliders
together, `data-part` included, which no button carries today either.

### Bundle constraint

Each hook lives in the file with its component. **No `hooks.ts` barrel** — a
module that imports from every part is the aggregated surface that cost
`4,025 B → 1,137 B` gzipped in **P1-a**. `src/index.ts` re-exports them
individually, as it already does.

Five of those files will start warning under
`react-refresh/only-export-components` once they export a hook beside their
components. `TimeDisplay.tsx` already carries a file-level disable with a written
reason; give the other five the same treatment rather than leaving warnings in the
build.

### The missing-provider error becomes consumer-facing

`usePlayerStore` throws `usePlayerStore must be used within a
PlayerStoreProvider`. Neither name is exported. That has been tolerable while the
only way to reach it was rendering a component in the wrong place; a hook is far
easier to call in the wrong place, and this is the phase that makes it public.

Reword it to name `<AudioPlayer>`, and update the matcher at
`testJSDom/store/PlayerStoreContext.test.tsx:19`. Leave the guard itself where it
is.

### Tests

The components become one-liners over their hooks, so the existing tests keep
their value **with no edits**: `buttonHandlers.test.tsx` renders the components
and therefore now covers component-and-hook together, and `PlayButton.test.tsx`
and its five siblings test the labels through the hook.

One path is genuinely new, because no component takes it — **calling the hook with
no argument at all**:

```jsx
<button {...usePlayButtonProps()}>Play</button>
```

One new file, six rows, nothing else. Each row calls its hook through `renderHook`
with no argument and asserts the bag is complete: `type`, `aria-label`, `onClick`
and `onKeyDown` all present. Miss the `props ?? {}` default on a single hook and
that hook throws at runtime while every existing test stays green and the types
say it is fine.

Deliberately **not** done: re-testing composition through each of the six.
`useComposedButtonProps.test.tsx` owns the merge rule and
`buttonHandlers.test.tsx` owns the wiring; a third pass per hook is ceremony.

## Phase 3 — the two slider hooks (D1)

`useSliderControlProps(props?)` and `useSliderThumbProps(props?)`. Same one-liner refactor
of `SliderControl` and `SliderThumb`.

Both read `SliderContext`, so both require a `<Timeline>` / `<Volume>` /
`<PlaybackRateSlider>` root. Reuse the existing provider guard — `SliderContext.tsx:31-33`
is the standard the rest of the library is measured against.

Two notes for the JSDoc:

- `useSliderControlProps` returns `ref` (the track measurement callback). On React 18,
  spreading that into a component that is not `forwardRef` warns. Document it. It overlaps
  **D2**, which is the ticket that makes the library's own parts ref-forwarding.
- The bag is DOM attributes, which is what makes this safe to expose while **C2**–**C5**
  are open. `role`, `aria-valuenow`, `onKeyDown` and a ref do not change when the mode
  discriminant or the ResizeObserver binding get reworked. Do **not** export `useSlider`
  itself, or its return shape becomes public API and those four tickets get much more
  expensive.

---

## Phase 4 — docs and ticket hygiene

- README: a hooks section, and a rewrite of the opening sentence. "composed the way Radix
  UI components are" oversells once `asChild` is declined — it is the most-used part of
  that API.
- Document the `{ key: null }` unbind from Phase 1 alongside `customKeyboardShortcuts`.
- Scope the accessibility promises. They hold for the components. The hooks hand you the
  props and you decide where they go, so a consumer who spreads badly can defeat the
  disabled gate. Say so plainly rather than leaving the section reading as unconditional.
- **D1**: resolve. Record the `asChild` refusal and its two reasons — inverted locks,
  unavoidable bundle cost — as a **D9** entry.
- **D1**, one correction to carry across: its premise is wrong. "Deciding after publish is
  not [defensible] — it means shipping both, or breaking the prop type of all ten roots"
  is true of `asChild` only. Hooks first makes `render` additive forever. And the ticket's
  deadline was never S24 — both ship in one release before the beta.
- **S24**: resolve, with the test count, matching S5's "Verified by" line. Note the seek
  guard as part of it.

---

## Verify

```
npx tsc --noEmit --project tsconfig.app.json
npx tsc --noEmit --project tsconfig.test.json
npx tsc --noEmit --project tsconfig.node.json
npx eslint .
npx prettier --check .
npx vitest run
```

Then the packaging pass, which has bitten this project before:

```
npx tsup
head -c 20 dist/index.mjs
npx attw --pack . --profile esm-only --exclude-entrypoints styles.css
```

`dist/index.mjs` must still start with `"use client"` (**S3** — the Rollup treeshake pass
strips the banner, which is why `tsup.config.ts` re-applies it in `onSuccess`).

E2E last: `npx playwright test`. If the webServer appears to hang, that is the known local
toolchain problem, not the change — use `playwright.local.config.ts`.

Re-measure the **P1-a** number: a `PlayButton`-only import should not regress from
~1,137 B gzipped. Phase 1 moves it slightly — `composeEventHandlers` enters a button's
graph for the first time — so expect a small increase, not zero, and confirm it is only
that. Phase 2 should move it only by the bytes of the hook's own export.

## Report

- Whether the six buttons could genuinely collapse to one-liners, or what resisted
- Whether the generic return type needed an assertion, and where
- The P1-a measurement, before and after
- Anything in the E2E suite that depended on the replace behaviour
- Whether the seek guard changed any existing test's expectations
