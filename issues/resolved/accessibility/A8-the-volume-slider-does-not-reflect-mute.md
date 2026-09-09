---
id: A8
title: "The volume slider does not reflect mute"
epic: accessibility
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured]
---

After Mute: element `muted: true`, slider still `aria-valuenow="1" aria-valuetext="100%"`.
After 25 ArrowDowns: `{muted: true, volume: 0.05}` while announcing "5%".
`sliderModes.ts:56` derives the text from volume alone and never sees `muted`.

## Resolution

**Shipped** — `aria-valuetext` on the volume slider composes the mute with the volume — "Muted, 80%". `aria-valuenow` deliberately unchanged: it is the volume, and muting does not move the thumb. Verified by 5 jsdom rows and an E2E round-trip through the mute button

**Verified by** —
