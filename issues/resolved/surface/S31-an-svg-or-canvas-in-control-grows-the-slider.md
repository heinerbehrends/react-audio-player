---
id: S31
title: "An SVG or canvas inside `.Control` grows the slider past its height"
epic: surface
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's waveform example (D8, phase 3). Every slider root and
`.Control` is an inline one-cell grid, `grid-template-rows: 1fr`. A bare `1fr`
is `minmax(auto, 1fr)`: the row never shrinks below its content's minimum. An
element with an intrinsic aspect ratio — an SVG with a `viewBox`, a `<canvas>`,
an `<img>` — sets that minimum from its width, so bars drawn into a 72px
`<Timeline>` grew it to 519px at 830px wide. Both grids take part, so a
consumer has to find `min-height: 0` and put it on the drawing and on
`.Control`.

That is exactly the markup **D5** is about: a paint surface inside the slider's
semantics. A canvas has an intrinsic size of 300 × 150 even before it draws.

## Resolution

**Shipped** (2026-10-06). `rootStyles`, which every slider root spreads and
`.Control` inherits through `containerStyles`, uses `minmax(0, 1fr)` for both
tracks. Where the root has a height, the content no longer outgrows it; where
it has none, the cell still sizes to its content. The waveform example dropped
its two `min-height: 0` rules.

The columns went back to `1fr` the same day. Content at `width: 100%` adds
nothing to a column's minimum, so `minmax(0, 1fr)` changed no layout measured
there. It did collapse a vertical slider with no width of its own to 0px
inside a `width: min-content` box, in Chromium and Firefox.

**Verified by** — an E2E test in `testE2E/demo/examples.spec.ts`: the waveform's
timeline is 72px tall. It fails at 518.75px with `1fr` restored. The jsdom
style assertions in `calculateStyle.test.ts`, `Timeline.test.tsx` and
`Volume.test.tsx` follow the new value. Checked in Chromium before the change:
the basic example's 20px sliders are unchanged.
