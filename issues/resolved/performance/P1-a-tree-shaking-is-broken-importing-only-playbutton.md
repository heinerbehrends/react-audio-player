---
id: P1-a
title: "Tree-shaking is broken — importing only `<PlayButton>` costs 66 % of the library"
epic: performance
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured, verified]
---

The most valuable performance finding. Rollup 4.44, `dist/index.mjs` as shipped, React
external, minified + gzipped:

| consumer imports           | gzip        | share of full bundle |
| -------------------------- | ----------- | -------------------- |
| everything                 | 6,139 B     | 100 %                |
| **`PlayButton` only**      | **4,025 B** | **66 %**             |
| `Time` only                | 3,821 B     | 62 %                 |
| `Timeline` + `AudioPlayer` | 5,187 B     | 84 %                 |

✅ **Independently corroborated.** I bundled the shipped `dist` with esbuild and grepped the
`PlayButton`-only output: `"Playback rate slider"`, `"Volume slider"`, `"Timeline slider"`,
`"Toggle elapsed"` and `ResizeObserver` are **all still present**. A consumer importing one
button ships the entire slider engine.

_Cause 1 — `Object.assign(X, {...})` is an un-droppable side-effecting call._ Three sites:
`Volume.tsx:65`, `PlaybackRateSlider.tsx:84`, `TimeDisplay.tsx:92`.
**The codebase already contains the working pattern** — `Timeline.tsx:91-94`,
`PlaybackRate.tsx:16-19`, `PlayButton.tsx:82-83` and `MuteButton.tsx:73-75` use plain
property assignment and **do** shake away cleanly.
Measured fix (three one-line changes, no runtime/type/API change):
**PlayButton-only 4,025 B → 1,125 B gzip, −72 %.** 🔬

_Cause 2 — `sideEffects: false` is inert as configured._ `package.json:28` sets it, but
`tsup.config.ts` has `splitting: false` with a single entry, so `dist/` is **one module** —
and `sideEffects` operates at _module_ granularity. Measured: a multi-module build takes
PlayButton-only to **1,092 B**. Either fix alone lands at ~1.1 KB.

## Resolution

**Shipped** — Three `Object.assign` compound roots → property assignment. Rollup: a `PlayButton`-only import went **4,025 B → 1,137 B gzipped (−72 %)**

**Verified by** —
