---
id: D5
title: "Let `Timeline` host a waveform rather than drawing one"
epic: features
status: resolved
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

## Resolution

**Resolved by the waveform example** (2026-10-06). A `<Timeline>` hosts a
paint surface it did not draw: `examples/waveform` puts precomputed SVG bars
inside `<Timeline.Control>`, and keeps the slider's role, keys and announced
value. Two changes made that work, both shipped for their own reasons:
S20's `--progress` lets the played copy clip in CSS, and S31's
`minmax(0, 1fr)` grid rows stop the drawing growing the slider. A canvas
sized at `width: 100%` measured the same. wavesurfer.js itself was not tried;
its canvas is the same kind of child.
