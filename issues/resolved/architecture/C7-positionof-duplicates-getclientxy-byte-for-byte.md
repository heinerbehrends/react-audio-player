---
id: C7
title: "`positionOf` duplicates `getClientXY` byte-for-byte"
epic: architecture
status: resolved
severity: P2
origin: review
breaking: false
evidence: [verified]
---

`useSlider.ts:57-64` vs `sharedFunctions.ts:132-142`. `getClientXY` and `PositionEvent` now
have **zero callers in `src/`** — only the test file imports them. So there is a
tested-but-dead export and an untested live duplicate of it. Separately, `Orientation` is
declared twice (`sharedFunctions.ts:1` and `sliderModes.ts:6`), with different files
importing different copies.

## Resolution

**Shipped** — Both duplicates deleted rather than reconciled: `getClientXY` had no consumer in `src/` (its test was what kept it alive), and `sliderModes`'s `Orientation` was declared and never used. `positionOf` survives in `Slider/pointerPosition.ts` — a module of its own because it is the one DOM-coupled helper in the slider stack, and because the repointed tests are the only unit coverage of axis selection, jsdom's fixtures having `clientX === clientY`

**Verified by** —
