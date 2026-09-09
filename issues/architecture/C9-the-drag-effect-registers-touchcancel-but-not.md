---
id: C9
title: "The drag effect registers `touchcancel` but not `touchend`"
epic: architecture
status: open
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

`useSlider.ts:334-384` — while the press-wait block in `onTrackPointerDown` registers
`touchend`. Probably covered by `pointerup` on modern browsers, but the asymmetry between
the two listener sets is unexplained.

## Where it stands

The drag effect registers `touchcancel` but not `touchend`, while the press-wait block registers `touchend`.
