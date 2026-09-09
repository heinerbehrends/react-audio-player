---
id: A6
title: "Home and End do nothing on any slider"
epic: accessibility
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured]
---

`useSlider.ts:315-331` handles only `ARROW_KEYS`; everything else falls through to the
global map, where Home/End/PageUp/PageDown are unmapped. Home/End are **required** by the
APG Slider pattern. For the timeline there is currently no keyboard "jump to start/end"
except the undocumented `0` shortcut.

## Resolution

**Shipped** — `Home` / `End` on every slider, through `commit` so the seek slider does not snap back. Slider-scoped, not added to the global map. Verified by 7 jsdom rows plus 2 E2E — one of which pins that `Home` on a _button_ is still the browser's

**Verified by** —
