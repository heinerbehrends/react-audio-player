---
id: S10
title: "No escape hatch to the `<audio>` element"
epic: surface
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
also: [F9]
---

`AudioElement` is not exported and
`AudioPlayer.tsx:23` renders `<AudioElement />` with no props and no children. Blocks:
`<track>` (captions), `preload`, `crossOrigin` (→ no Web Audio, no visualisers, no HLS.js),
multiple `<source>`, and any `ref`. Ironically `AudioElement.tsx:5-9` already accepts
`AudioHTMLAttributes` and children — fully built, simply unreachable.

## Resolution

**Shipped** — `audioProps` and `audioRef` on `AudioPlayer` — unblocks `crossOrigin` (and so Web Audio), `preload`, `<track>` captions and HLS.js

**Verified by** —
