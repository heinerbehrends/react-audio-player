---
id: S1
title: "`className` is silently dropped on `<Timeline>` and `<Volume>` — while the types accept it"
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

The single worst finding.
`Timeline.tsx:57-63` and `Volume.tsx:41-56` destructure `...props` and never spread it —
only `props.style` is read. Rendering `<Timeline className="my-track" id="tl" data-x="1"
onClick={fn}>` emits `<div role="group" style="...">` and nothing else.
`PlaybackRateSlider.tsx:69` **does** spread correctly, so the surface is inconsistent too.
Types promise `HTMLAttributes<HTMLDivElement>`, runtime discards it: no error, no warning,
a stylesheet that does nothing. Every Tailwind, CSS-Modules and styled-components user hits
this in the first ten minutes. Fix is one line each; non-breaking.

## Resolution

**Shipped** — `{...props}` spread on the `Timeline` and `Volume` roots

**Verified by** — `className`, `id` and handlers now reach the DOM
