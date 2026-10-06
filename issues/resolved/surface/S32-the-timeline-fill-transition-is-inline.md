---
id: S32
title: "The timeline fill's transition is inline, so CSS cannot change or remove it"
epic: surface
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's waveform example (D8, phase 3). The played part of
the waveform is a second copy of the bars, cut at the playhead with a
`clip-path` — scaling, `.Progress`'s default, squashes them. `.Progress` was
the natural home for that copy: it already smooths the ~4 Hz `timeupdate`
steps over 250ms and stops easing during a drag. But it set
`transition: transform 250ms linear` inline, so a `clip-path` got no
transition, and only the `style` prop could change that — which also replaced
the drag handling. The example rebuilt both in its own CSS on a plain element.

S28 had already moved the fill's size and transform into a zero-specificity
rule for the same reason; the transition was the part left behind.

A rule for the timeline's fill alone needed a selector, and the three sliders
share their part names. So each root now says which slider it is.

## Resolution

**Shipped** (2026-10-06).

- Every slider root carries `data-slider="timeline|volume|rate"`, from the
  slider mode table's `component`. That field is internal and was spelled
  `"playbackRate"`; it is `"rate"` now, so one name serves both.
- The fill's `<style>` gains two `:where()` rules:
  `transition: transform 250ms linear` on the timeline's fill, and
  `transition-duration: 0s` on any fill whose root is dragging, after it. Only
  the duration, so a consumer's `transition-property` keeps both.
- `Timeline.Progress` sets no inline style of its own. `style={{ transition:
"none" }}` still wins, as it did.
- The waveform example's played copy is a `Timeline.Progress` with
  `transform: none`, its `clip-path` and `transition-property: clip-path`; its
  own transition and drag rule for the fill are gone. The README documents the
  attribute, and the transition under "What stays inline" with that example.

**Verified by** — an E2E test in `testE2E/Timeline/drag-state.spec.ts`, in
Chromium and Firefox: the fill's computed `transition-duration` is `0.25s`
idle, `0s` mid-drag, and `0.25s` after. It fails with the drag rule removed.
jsdom tests pin the rule text and its order, the absence of an inline
transition, and `data-slider` on each root and nowhere else.
