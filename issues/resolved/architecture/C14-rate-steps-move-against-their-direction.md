---
id: C14
title: "Rate steps move against their own direction, and the rate range is three ranges"
epic: architecture
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [measured]
---

C8 sent `PlaybackRate.Change` through `INCREASE_PLAYBACK_RATE` /
`DECREASE_PLAYBACK_RATE`, which clamp to the slider's 0.5–4. `PlaybackRate.Set`
and `setRate` write anything in the browser's 0.0625–16. So a rate that `.Set`
reached was one a step could not keep:

- at 8x, "Increase by 0.25x" dropped the rate to 4
- at 0.25x, "Decrease" raised it to 0.5
- `amount={0}` at 8x dropped it to 4

The `<` `>` keys did the same before C8; C8 extended it to the button.

Underneath, the library had three ranges: the write's 0.0625–16 (plus `0`), the
steps' 0.5–4, and the slider's 0.5–4 default. The browser's accepted range is
also not the useful one. Probed on 2026-10-05: a real MP3 routed through an
`AnalyserNode`, peak RMS while playing at each rate.

| rate        | Chromium 151                      | Firefox 153            |
| ----------- | --------------------------------- | ---------------------- |
| 0.0625–0.12 | see below                         | silent (RMS exactly 0) |
| 0.125–8     | audible from 2x; below, see below | audible                |
| 9–16        | audible                           | silent (RMS exactly 0) |

Firefox accepts the rate and advances `currentTime` at the requested speed,
but cuts the sound. Chromium's analyser read near-silent at every rate up to
1.01x, 1x included, headed and headless, so its low end could not be measured
this way. The signal was not exactly 0 there, unlike Firefox's cut. Safari is
not measured: WebKit is not installed on the dev machine (**T13**).

## Resolution

**Shipped** (2026-10-05) — One hard range, `RATE_LIMITS` = 0.125–8 in
`src/AudioElement/sideEffectActions.ts`, the widest range audible in both
engines. Every rate write clamps to it: `.Set`, `setRate`, the slider commit,
`.Change` and the `<` `>` keys. `0` is no longer written; stopping is pause's
job. `RATE_BOUNDS` stays as `<PlaybackRateSlider>`'s 0.5–4 default, so 1x
sits near the middle of the track. A slider can be widened up to the limits.

A step goes through `stepRate` in `handleSideEffect.ts`. It stops at its
bound, and writes nothing when the clamped result would move the rate against
the step's direction. A rate past a narrower slider's bound, or set outside
the library, stays put. A step of 0 is a no-op.

**Verified by** — `clamps %s into 0.125–8`, `leaves %s where it is` and
`still moves a rate past the bound back towards it` in
`testJSDom/AudioElement/handleSideEffects.test.ts`; `%s leaves the rate where
it is` and `decreases from 8x rather than jumping to the slider's ceiling` in
`testJSDom/PlaybackRate/ChangePlaybackRate.test.tsx`.
