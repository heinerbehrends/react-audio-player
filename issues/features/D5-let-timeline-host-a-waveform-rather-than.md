---
id: D5
title: "Let `Timeline` host a waveform rather than drawing one"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

wavesurfer.js is
the centre of gravity for audio UI on the web, and it has a real gap: what it
draws is a canvas, not a `role="slider"` with arrow keys, `Home`/`End` and an
announced value. This library is the exact complement — the semantics with no
drawing. The move is not a renderer; it is making the slider root able to host
someone else's paint surface, so a consumer gets wavesurfer's pixels inside
these keyboard and screen-reader semantics. `useCurrentTime()` already exists
for the continuous redraw, and is already documented as being for this.
