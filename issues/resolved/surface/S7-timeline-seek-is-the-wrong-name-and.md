---
id: S7
title: "`Timeline.Seek` is the wrong name and collides with the top-level `Seek`"
epic: surface
status: resolved
severity: P0
origin: review
breaking: true
evidence: [code-reading]
---

Two exports named "Seek": a slider track and a skip button. The three sliders don't even
agree — `Timeline.Seek` but `Volume.Set` and `PlaybackRateSlider.Set`, all the _same_
component. Suggested: rename all three to `.Track` (its own doc comment says "it measures
the track, since it **is** the track") and the top-level `Seek` → `SkipButton`. Breaking,
free now.

## Resolution

**Shipped** — `.Seek`/`.Set` → `.Control`, `.Drag` → `.Thumb`, `Seek` → `SeekButton`

**Verified by** — 406 + 52 green with **no logic change**
