---
id: T8
title: "`toBeCloseTo(x, 0.25)` — 14 assertions with a fractional `numDigits`"
epic: tests
status: resolved
severity: P1
origin: review
breaking: false
---

, giving a
±0.281 tolerance. Assessed individually: most are _thin but fine_ (±0.28 s on a seek to an
exact target still catches a wrong step or direction) and should simply be rewritten as
`toBeLessThan(0.3)` so the number reads as what it is. Two are vacuous (T2, T3).
Opposite problem: `drag-drop-time.spec.ts:78,84,86` uses `toBeCloseTo(px, 1)` = **±0.05 px**
on a layout coordinate — a flake waiting to happen.

## Resolution

**Shipped** — `toBeCloseTo(x, 0.25)` — ±0.281 by way of a fractional `numDigits` — became `SEEK_TOLERANCE_S = 0.3` through an `expectNear` helper that reports both numbers on failure, across 13 assertions. The inverse case in `drag-drop-time.spec.ts`, `toBeCloseTo(px, 1)` = ±0.05 px on a layout coordinate, is now `LAYOUT_TOLERANCE_PX = 1`

**Verified by** —
