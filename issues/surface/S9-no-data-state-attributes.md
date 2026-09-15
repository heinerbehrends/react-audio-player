---
id: S9
title: "No `data-*` state attributes"
epic: surface
status: partial
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

Do the whole vocabulary as one pass after D1's Phase 3, when the slider parts are in
hand — buttons and sliders together, `data-part` included, which no button carries today
either.
