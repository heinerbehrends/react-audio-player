---
id: S29
title: "`--progress` leaves its range, and waits for a measurement it does not need"
epic: surface
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [verified]
---

`--progress` is documented as `0`–`1` (S20) but was never clamped. A rate set
past the rate slider's bounds through `PlaybackRate.Set` gave `2.14` at 8x on
the default 0.5–4 range, and the timeline can pass `1` at `ended` in Chrome,
where `currentTime` can exceed `duration`. The thumb's offset had the same
flaw, so the thumb left the track.

It also read `0` until the track was measured, though the fraction does not
depend on the track's length. Only `--offset` does.

## Resolution

**Shipped** (2026-10-05). `getFraction()` in `src/Slider/sliderMath.ts` clamps
the value's position in its range to `[0, 1]`, and is `0` on an empty range.
`--progress` reads it directly, measured or not. `getOffset()` is built on it,
so the thumb's transform and `--offset` stay on the track and agree with each
other; `--offset` still reads `0px` before measurement.

**Verified by** — in `testJSDom/Slider/calculateStyle.test.ts`: `clamps a
value above/below the range to the track` (both custom properties and the
thumb transform), `clamps a vertical offset to the track, from the top`, and
`an unmeasured track` (`--progress` without a measurement). In
`testJSDom/Slider/sliderMath.test.ts`, `clamps a … offset … to the track` in
both orientations. In `testJSDom/PlaybackRate/PlaybackRateSlider.test.tsx`,
`clamps --progress for a rate past the slider's maximum` at 8x.
