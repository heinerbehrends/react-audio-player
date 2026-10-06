---
id: P4
title: "The timeline bundle carried the volume and rate sliders' code"
epic: performance
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [measured, verified]
---

Every slider root called `useSlider` with a mode string, and the hook looked
its config up in one `SLIDER_MODES` object. So "Timeline only" carried both
other configs — `"Volume slider"`, `"Muted, …"`, `"…x"`, their actions and
formatting helpers — and the volume-availability probe, which `useSlider` ran
in every mode for the volume slider's sake. `FOREIGN_STRINGS` had no entry for
the timeline, so nothing caught it.

Measured on 2026-10-06 by cutting the code out of the minified bundle: the two
configs and their helpers were 176 B of 4370 B, and with the probe 255 B.

## Resolution

**Fixed** (2026-10-06). Each root passes its own config:

- `SEEK_MODE`, `VOLUME_MODE` and `RATE_MODE` are separate exports, each with
  its `mode` and, for volume and rate, its default bounds.
- `<Volume>` runs the volume probe and passes `disabled` to `useSlider`, which no
  longer imports it or `RATE_BOUNDS`.
- The root attributes read `component` off the slider value instead of looking
  the mode up.

"Timeline only": 4375 → **4092 B** (−283 B). "Full surface" +9 B. The bundle
script now fails "Timeline only" if it contains `"Volume slider"`,
`"Playback rate slider"` or `"Muted, "`.

Left in `useSlider`: the `muted` subscription and the unmute-on-grab hold,
both behind config flags, and the atom choice by mode. Moving them would mean
config-supplied hooks, for perhaps another 50–80 B.

**Verified by** — the jsdom suite (821) through the same `useSlider` tests, now
mapping each mode to its config; the iOS case through the real `<Volume>` in
`SliderControl.test.tsx`; and the volume, rate, timeline, keyboard and a11y E2E
specs in Chromium and Firefox (92).
