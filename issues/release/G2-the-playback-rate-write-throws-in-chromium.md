---
id: G2
title: "The playback-rate write throws in Chromium below 0.0625"
epic: release
status: open
severity: P1
origin: assessment
breaking: false
evidence: [measured]
---

`writeRate` in `src/AudioElement/handleSideEffect.ts` clamps to `[0, 16]` and
its comment says that is Chrome's range. It is not. Probed on 2026-10-01 with
Playwright's Chromium and Firefox, assigning `playbackRate` on a bare element:

| value    | Chromium            | Firefox             |
| -------- | ------------------- | ------------------- |
| `0`      | ok                  | ok                  |
| `0.01`   | `NotSupportedError` | ok                  |
| `0.0625` | ok                  | ok                  |
| `16`     | ok                  | ok                  |
| `16.01`  | `NotSupportedError` | ok                  |
| `-1`     | `NotSupportedError` | `NotSupportedError` |

Chromium rejects any non-zero magnitude below 0.0625, and anything above 16.
Firefox clamps silently. So `setRate(0.01)`, `<PlaybackRate.Set rate={0.03}>`
or `<PlaybackRateSlider minValue={0.05}>` throws inside a React event handler in
Chrome, uncaught, and the component tree errors. The slider's default floor is
0.5, so the defaults are safe; it is consumer input that reaches it, which is
exactly what the clamp is there to guard.

This is the other half of **C8**: that ticket decided the library's 0.5–4
policy stays unenforced on `.Set` and the write clamps to the browser's range
instead — which only works if the clamp _is_ the browser's range.

## What to do

Clamp a non-zero magnitude to `[0.0625, 16]`, keep `0` as the one value below
it, and fix the comment. Add the three probes above to the clamp tests in
`testJSDom/AudioElement/`, which already cover the `NaN`-before-metadata paths.
