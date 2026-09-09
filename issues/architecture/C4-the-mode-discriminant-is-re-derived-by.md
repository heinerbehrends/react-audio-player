---
id: C4
title: "The mode discriminant is re-derived by hand six times"
epic: architecture
status: open
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`useSlider.ts:96-116`, immediately above the `config` resolved for the purpose. Two live
consequences: `store.duration` is subscribed **unconditionally**, so every volume and rate
slider re-renders on `durationchange` for a value it never uses; and the `mode === "seek"`
branch silently discards a caller's `maxValue`, which `UseSliderOptions` advertises for all
modes.

## Where it stands

The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.
