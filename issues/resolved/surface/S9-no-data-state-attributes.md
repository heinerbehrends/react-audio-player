---
id: S9
title: "No `data-*` state attributes"
epic: surface
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

Only `data-testid` in the demo. Drag state lives
solely in the private `SliderContext`, so a consumer **cannot** style the dragging state
from CSS _or_ JS — no workaround exists. Everything needed is already computed by
`usePlayerState()` / `useVolumeState()`. Proposed: `data-orientation`, `data-state`,
`data-disabled` on the roots, track, thumb, `PlayButton`, `MuteButton`. Additive.

## Where it stands

Still open: the **state** attributes `data-state` (idle/dragging, playing/paused, muted/low/high), `data-orientation` and `data-disabled`. Drag state remains unreachable from CSS _and_ JS.

## Resolution

**Shipped** — Every slider part carries `data-part` (`control`, `thumb`, `progress`, `background`), giving consumers a styling hook and tests a selector that is library output rather than demo markup. Verified by the rewritten `progress-indicator.spec.ts`, whose old query matched nothing

**Verified by** —

## Not closed by the props hooks (2026-09-15)

**D1**'s Phase 2 asked whether putting `data-state` and `data-disabled` into the button
props bags would close the open half as a side effect. It was checked and declined.

`data-state` is free for only three of the six buttons — `PlayButton` already calls
`usePlayerState()`, `MuteButton` `useVolumeState()`, `Time.Toggle` reads `timeDisplay` —
with `PlaybackRate.Set` nearly free via `isCurrent`. `SeekButton` and
`PlaybackRate.Change` hold no state of their own, so the result would be four buttons
carrying the attribute and two permanently without it.

`data-disabled` is not free: `useComposedButtonProps` computes `isDisabled` but does not
return it, so it changes a type the props-hook work had just settled and adds an
attribute to the rendered DOM of all six components.

And the severe half of this ticket is not about buttons at all. Slider `data-state`
(idle/dragging) and `data-orientation` live in `SliderContext`, and drag state is the one
this ticket singles out as reachable from neither CSS nor JS with **no workaround**. No
amount of button work reaches it.

Do the whole vocabulary as one pass, buttons and sliders together, `data-part` included,
which no button carries today either.

## This ticket is now D1's Phase 3 (2026-09-15)

D1's Phase 3 was two slider props hooks. They were refused — no design system owns an
audio scrubber, so there is no existing element to spread a bag onto — and the phase
became this pass instead. Plan:
`plans/PLAN-button-handlers-and-props-hooks.md`, Phase 3.

**The rule: a `data-*` attribute earns its place when that element does not already carry
the information.** It decides every case below, and it is the sentence for the README.

**`data-disabled` is declined, not forgotten.** All six buttons and `.Control` already
render `aria-disabled="true"`, and the library already documents styling from it — a
second attribute would be a second spelling of a state that is in the DOM. The slider
root has no disabled signal of its own and still needs no attribute:
`[data-part="root"]:has([aria-disabled="true"])` reaches it.

**`data-state` on three of the six buttons**, for a stated reason rather than by
accident. `PlayButton` (playing/paused/loading/error), `MuteButton` (muted/low/high) and
`Time.Toggle` (elapsed/remaining) have state nothing else announces.
`PlaybackRate.Set` does not get one — `aria-pressed` already carries it. `SeekButton` and
`PlaybackRate.Change` have no state at all. It lives in the props bag rather than the
JSX, because the components are one-liners over their hooks and an attribute in the JSX
alone would not reach `<button {...usePlayButtonProps()}>`.

**`data-state` and `data-orientation` on the slider root only.** Drag is a property of
the slider, not the thumb, and all four parts are descendants — one attribute reaches
them all, and four copies would be four chances to disagree. `data-orientation` is
non-redundant precisely because `aria-orientation` sits on `.Control`, a child, where a
root-level layout rule cannot see it.

**`data-part` on the buttons too**, plus `ErrorMessage` and `PlaybackRate.Display`, so
every part in the library has one. The reason is i18n rather than symmetry:
`aria-label` is deliberately overridable (**A15**), so `button[aria-label="Play audio"]`
is a selector the library invites consumers to break the day they ship in another
language. `data-part="play"` does not move when the label does. Values: `play`,
`mute`, `seek`, `time-toggle`, `rate-set`, `rate-change`, plus `error` and
`rate-display` for the two parts that carry nothing today.

## Resolved (2026-09-15)

**Shipped** — The whole vocabulary, on the rule above: an attribute exists where the
element does not already carry the information.

`data-part` on every part in the library. The six buttons (`play`, `mute`, `seek`,
`time-toggle`, `rate-set`, `rate-change`) get it from their props hooks rather than their
JSX, so `<button {...usePlayButtonProps()}>` carries what `<PlayButton>` does;
`PlaybackRate.Display` gained `rate-display`, and `ErrorMessage` already had `error`.

`data-state` on the three buttons whose state nothing else announces —
`playing|paused|loading|error`, `muted|low|high`, `elapsed|remaining` — and named in each
hook's return type, since the values are now API. `PlaybackRate.Set` has none:
`aria-pressed` already says it.

`data-state="idle|dragging"` and `data-orientation` on the slider **root**, from one
`sliderRootAttributes(slider)` helper that all three roots spread. That closes the P1 half
of this ticket: drag state is reachable from CSS and JS, where it was reachable from
neither. The values are read off `slider`, so they cannot drift — hand-writing
`data-orientation` on `Timeline` would have meant hardcoding `"horizontal"` on a component
with no orientation prop.

`data-disabled` is **declined**, not overlooked. Every button and `.Control` already
renders `aria-disabled="true"`, and the README documents styling from it. The slider root
carries no disabled signal of its own and still needs none:
`[data-part="root"]:has([aria-disabled="true"])` reaches it from the control inside. One
state, one spelling.

The three slider roots had also drifted on spread order — `PlaybackRateSlider` put `style`
before `{...props}` while the other two put it after. All three are now `{...props}` then
a merged `style`, which keeps `position: relative` under the thumb's `transform`.

**Verified by** — 29 tests: `dataAttributes.test.tsx` (every part name, the root-only rule
for `data-state`/`data-orientation`, a vertical `<Volume>`, the style merge on all three
roots), the `data-state` block in `buttonPropsHooks.test.tsx` including the three hooks
that write none, and `testE2E/Timeline/drag-state.spec.ts` for the drag transient, which
needs a real pointer sequence

Documented in the README under **Styling → State attributes**, with the rule above the
table and `[aria-disabled]` / `[aria-pressed]` named as the spellings to use, so neither
is looked for as a missing `data-`.
