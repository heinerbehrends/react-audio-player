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
