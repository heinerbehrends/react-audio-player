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

Each hook takes the consumer's props and returns the finished bag:

```ts
export function usePlayButtonProps(
  props?: React.ButtonHTMLAttributes<HTMLButtonElement>,
): React.ButtonHTMLAttributes<HTMLButtonElement>;
```

The component then becomes a one-liner over its own hook:

```jsx
function PlayButtonComponent({ children, ...props }) {
  return <button {...usePlayButtonProps(props)}>{children}</button>;
}
```

That is the property worth having: the component and the hook **cannot drift**, because
the component has no behaviour left of its own. Merge order is defined once, in the hook,
and both callers get it.

Each of the six is thin, because `useComposedButtonProps` already owns the merge rule —
the hook adds its own label and action and spreads the composed bag last.

The six, with the knowledge each one carries:

| Hook                                 | What only the library knows                              |
| ------------------------------------ | -------------------------------------------------------- |
| `usePlayButtonProps(props?)`         | The four-name label map (A4)                             |
| `useMuteButtonProps(props?)`         | "Mute"/"Unmute", and deliberately no `aria-pressed` (A4) |
| `useSeekButtonProps(amount, props?)` | Label follows the sign; also gates on `isSeekable`       |
| `useTimeToggleProps(props?)`         | "Show time elapsed"/"Show time remaining"                |
| `useSetRateProps(rate, props?)`      | `aria-pressed` on every button, false ones included (A9) |
| `useChangeRateProps(amount, props?)` | "Increase/Decrease playback rate by {n}x"                |

Check the names against the existing exports before committing to them —
`useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsAtEnd`, `useIsBuffering`,
`useIsSeekable`, `useAudioError`.

### The footgun this phase adds

Once the bag is public, the consumer does their own spreading — and
`<button {...usePlayButtonProps()} onKeyDown={mine} />` puts their handler back on top of
the composed one, outside the hook's reach. Phase 1 has no equivalent, because the library
controls the JSX. Phase 4's doc scoping is the answer; note it here so it is not
rediscovered as a bug.

### Bundle constraint

Each hook lives in the file with its component. **No `hooks.ts` barrel** — a module that
imports from every part is the aggregated surface that cost `4,025 B → 1,137 B` gzipped in
**P1-a**. `src/index.ts` re-exports them individually, as it already does.

### Worth checking while you are in there

If the bags carry `data-state` (playing/paused, muted/low/high) and `data-disabled`, the
open half of **S9** lands as a side effect rather than as its own pass. Check whether that
is a free addition or a scope increase, and say which.

---

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
- Whether `data-state` in the bags closes S9's open half for free
- The P1-a measurement, before and after
- Anything in the E2E suite that depended on the replace behaviour
- Whether the seek guard changed any existing test's expectations
