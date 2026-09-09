---
id: T10
title: "`handleSideEffect` null guard asserts nothing"
epic: tests
status: resolved
severity: P2
origin: review
breaking: false
evidence: [measured]
---

`handleSideEffects.test.ts:29-32` — `expect(result).toBeUndefined()` where the function
returns `void` on every path. `createPlayerStore.test.ts:129-133` shows the right shape
(`.not.toThrow()`).

## Resolution

**Shipped** — `.not.toThrow()` in place of `toBeUndefined()` on a `void` function, matching `createPlayerStore.test.ts`

**Verified by** —
