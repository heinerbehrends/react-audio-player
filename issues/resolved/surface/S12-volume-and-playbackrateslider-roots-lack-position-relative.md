---
id: S12
title: "Volume and PlaybackRateSlider roots lack `position: relative`"
epic: surface
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`Timeline` gets it via `containerStyles`; `Volume.tsx:44-50` and
`PlaybackRateSlider.tsx:62-68` hand-inline a reduced set without it. `Drag` is
`position: absolute` with grid placement, which only applies when the grid container is its
containing block — so those two thumbs merely _happen_ to land nearby. Also: every slider
collapses to zero height unless the consumer sets one (the demo sets 40px on all three; the
README never mentions it), and `sliderLength` then measures 0 → silently dead slider.

## Resolution

**Shipped** — `position: relative` on the volume and rate roots, via a shared `rootStyles` the two had inlined a copy of. Verified by a row on each root — the thumb's containing block was previously whichever ancestor happened to be positioned

**Verified by** —
