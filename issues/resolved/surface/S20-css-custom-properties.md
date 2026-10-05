---
id: S20
title: "CSS custom properties"
epic: surface
status: resolved
severity: P3
origin: review
breaking: false
---

(`--progress`, `--offset`) as an _addition_ to the computed
transform — enables gradient fills, conic dials, and `width` instead of `scaleX` (which
distorts `border-radius`). Keep the transform as the default.

## Where it stands

CSS custom properties (`--progress`, `--offset`) alongside the computed transform.

## Resolution

**Shipped** (2026-10-05) — `sliderCustomProperties()` in
`src/Slider/calculateStyle.ts` returns `--progress` (the filled fraction,
unitless `0`–`1`) and `--offset` (the thumb position in `px`, measured as the
thumb's transform is), and all three slider roots merge it into their inline
style, before the consumer's `style` so it can still be overridden. On the root
rather than on `.Progress` or `.Thumb`, so every part inherits both and a fill
drawn on the background or the control can read them too. The transforms are
untouched and stay the default. Values are strings, so React never appends a
unit. Documented under Styling → Custom properties, with the `width` fill and
the conic dial as the two examples.

**Verified by** — `sliderCustomProperties` in
`testJSDom/Slider/calculateStyle.test.ts` (values, agreement with both
transforms, vertical direction, the slider's own range, and zero before
measurement) and `exposes the fill fraction and the thumb offset as custom
properties` in `testJSDom/Timeline/Timeline.test.tsx`, which reads them back
off the rendered root through `style.getPropertyValue`.

**Since** — the fill's inline transform outranked the README's own stylesheet
example, so the fill now draws from `--progress` through an overridable rule
(S28); both properties are clamped to the track, and `--progress` no longer
waits for a measurement (S29).
