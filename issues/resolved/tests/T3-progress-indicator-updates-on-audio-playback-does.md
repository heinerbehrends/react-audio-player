---
id: T3
title: '"progress indicator updates on audio playback" does not test that it updates'
epic: tests
status: resolved
severity: P0
origin: review
breaking: false
evidence: [measured]
---

Same file, `:44-46`. Plays for 100 ms so `currentTime ≈ 0.1`; `aria-valuenow` is
`Math.floor`-quantised to `0`; `|0 − 0.1| < 0.281` passes. **Freeze `aria-valuenow` at 0
permanently and this still passes.** Also latently flaky the other way on a slow machine.

## Resolution

**Shipped** — Plays until `aria-valuenow` moves, then compares like-for-like against `Math.floor(currentTime)`

**Verified by** — The old version passed with the attribute frozen at 0
