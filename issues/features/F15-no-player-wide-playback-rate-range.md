---
id: F15
title: "No player-wide playback-rate range"
epic: features
status: open
severity: P3
origin: backlog
breaking: false
---

Only `<PlaybackRateSlider>` takes a range (`minValue`, `maxValue`), and only its
own arrow keys follow it. `PlaybackRate.Change` and the `<` `>` keys stop at
`RATE_LIMITS` (0.125–8, C14). `.Set` and `setRate` clamp only to those limits.
So a player whose slider runs 0.75–2 can still reach 8x from the `>` key.

## Proposal

A `rateRange` prop on `<AudioPlayer>`, e.g. `rateRange={[0.75, 2]}`, clamped to
`RATE_LIMITS`. Every rate write follows it: the slider (as its default range),
`.Change`, the keys, `.Set` and `setRate`. Defaults to `RATE_LIMITS` for the
writes and to `RATE_BOUNDS` (0.5–4) for the slider, as now.

Open question: should a slider's own `minValue` / `maxValue` still be allowed
to go wider than `rateRange`, or be clamped to it?
