---
id: C1
title: "Rate-slider bounds live in three places and disagree"
epic: architecture
status: resolved
severity: P1
origin: review
breaking: false
evidence: [code-reading]
---

✅(partial)
`PlaybackRateSlider.tsx:49-57` (props default 0.5/4), `useSlider.ts:114-116` (mode defaults),
`handleSideEffect.ts:97-106` (clamps 0.5/4). With `<PlaybackRateSlider maxValue={2}>`, the
arrow-key path clamps at **4**, so arrow-up past 2 pushes the element beyond the track while
the thumb pins and `aria-valuenow` keeps climbing. Volume and seek don't have this — their
clamps match their maxima by construction.

## Resolution

**Shipped** — `RATE_BOUNDS` is the single default, read by the slider's prop defaults and `useSlider`'s; a slider with a narrower range sends its own bounds with the action, and the clamp uses them. Verified by a test pressing ArrowUp 20× against `maxValue={2}` and comparing with `End`

**Verified by** —
