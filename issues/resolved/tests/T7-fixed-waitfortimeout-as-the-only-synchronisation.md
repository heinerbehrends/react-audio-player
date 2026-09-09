---
id: T7
title: "Fixed `waitForTimeout` as the only synchronisation"
epic: tests
status: resolved
severity: P1
origin: review
breaking: false
---

— 30+ calls. Worst:
`toggle-play.spec.ts:27-37` waits 100 ms then reads `!audio.paused`; `play()` resolves
asynchronously and decode start is unbounded — a real race on a loaded CI box. It also does
`await expect(isPlaying).toBe(true)` on a plain boolean, which does **not** retry.
The suite already contains the right pattern (`ended.spec.ts:35-39`, `multi-instance.spec.ts:49-53`
use `waitForFunction` with an explicit predicate).

## Resolution

**Shipped** — 35 fixed `waitForTimeout` calls → 1. Three helpers in `test-utils.ts` (`waitForAudioField`, `waitForPlaying`, `waitForMuted`) wait on the element instead of on the clock. **Mutation-proven**: with `TOGGLE_PLAY` stubbed to a no-op, both `toggle-play` rows fail on a `waitForPlaying` timeout naming the line — the 100 ms sleep would have reported green. The one survivor is `no-snap-back`'s sampling cadence, which is deliberate and now says so. Side effect: several rows went 150 ms → 40 ms

**Verified by** —
