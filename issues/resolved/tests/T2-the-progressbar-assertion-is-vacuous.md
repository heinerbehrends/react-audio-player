---
id: T2
title: "The `progressbar` assertion is vacuous"
epic: tests
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

`progress-indicator.spec.ts:48-57` queries `[role="progressbar"]`, which exists nowhere in
the codebase → `null` → `0/1 = 0` vs an expected ratio of ~0.0005, under a 0.281 tolerance.
Passes unconditionally.

## Resolution

**Shipped** — The `role="progressbar"` query is gone; the fill is selected by the library's own `data-part="progress"`

**Verified by** — The old query returned `null` and passed unconditionally
