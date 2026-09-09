---
id: F12
title: "`getOffset` lacks the `range === 0` guard its sibling has"
epic: features
status: resolved
severity: P3
origin: review
breaking: false
evidence: [code-reading]
---

`sharedFunctions.ts:120-121` computes `(0-0)/0` for a live stream and hands
`translate(calc(NaN px - 20px))` to the thumb. `getProgress` guards this;
`getOffset` doesn't.

---

## Resolution

**Shipped** — `range === 0` guard in `getOffset`, matching `getProgress`. **Mutation-proven**: three rows fail when the guard is removed. Worse than the finding recorded — not only live streams but every player before `loadedmetadata`, since the duration is 0 then too, and the invalid `translate(calc(NaNpx - 50%))` made the browser drop the transform entirely

**Verified by** —
