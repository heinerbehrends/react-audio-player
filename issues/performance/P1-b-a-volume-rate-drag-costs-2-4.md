---
id: P1-b
title: "A volume/rate drag costs 2.4× a seek drag — the mode Phase 5 never traced"
epic: performance
status: open
severity: P1
origin: review
breaking: false
evidence: [measured]
---

Phase 5 profiled only the **timeline** drag, which is `writesDuringDrag: false` — the cheap
mode. `volume` and `rate` write the element per pointermove, so `volumechange` → atom →
subscriber wake → **a second React render per move**.

| main-thread busy per pointermove | 1×           | 4×      | 6×          |
| -------------------------------- | ------------ | ------- | ----------- |
| timeline (seek)                  | 0.195 ms     | 3.35 ms | 3.83 ms     |
| **volume**                       | **0.475 ms** | 3.95 ms | **5.77 ms** |
| layout ops / move                | **0**        | **0**   | **0**       |

At 6× throttle the volume drag uses **82 % of the 7.0 ms uncoalesced-pointer budget** vs
55 % for seek. That is the one place "fine on this laptop" is fair criticism.
**This is not an argument for memo** — the 8 `volume` subscribers each genuinely need the
value. Mitigating: 143 uncoalesced events/s is a _desktop mouse_ rate; touch is coalesced to
refresh rate. The genuine risk case is narrow.

**Free win inside it:** `useSlider.ts:96-110` **subscribes to the same atom twice** — the two
ternaries differ only in the `"seek"` branch, so in volume/rate mode both resolve to the same
atom. That is 12.5 % of the volume hot path's notification traffic returning an identical
value. _(Same code the architecture review flags as **C4**.)_

## Where it stands

The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.
