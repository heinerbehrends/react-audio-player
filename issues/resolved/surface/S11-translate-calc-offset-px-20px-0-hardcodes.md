---
id: S11
title: "`translate(calc(${offset}px - 20px), 0)` hardcodes a 40px thumb"
epic: surface
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`calculateStyle.ts:24-28`. Every demo thumb is exactly 40×40. A 16px thumb is drawn 12px off
at every position. Fix: `- 50%`, which resolves against the element's own border box and
self-centres at any size.

## Resolution

**Shipped** — `translate(calc(…px - 50%))` in place of the hardcoded `- 20px`, so the thumb self-centres at any size. Verified by the four assertions that had pinned the 40px assumption

**Verified by** —
