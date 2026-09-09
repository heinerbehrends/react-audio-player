---
id: T1
title: "`no-snap-back.spec.ts` cannot detect a snap-back"
epic: tests
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

The single most important E2E spec — named after the one invariant only a real media
element can exercise — asserts on the **element**, not the UI:

```ts
// no-snap-back.spec.ts:63,82 → sampleCurrentTime() → getTimelineState()
currentTime: audio?.currentTime ?? 0,   // test-utils.ts:30
```

The snap-back is a **UI** bug: after commit, display falls through to the `currentTime`
atom, which holds the pre-seek value until `seeked` echoes (~250 ms). The **element** never
snaps back — `el.currentTime = 40` is synchronous and stays 40.
Delete the entire retain-until-changed rule (`useSlider.ts:121-124,184-189,191-195,224-230`)
and **both rows still pass**, while the thumb and `aria-valuenow` visibly flick back to 0.
This is **the one finding where a real, user-visible bug can ship green.**
Fix: sample `aria-valuenow`, or better the thumb's `boundingBox().x`, which moves at 4 Hz
and sees the whole transient.

## Resolution

**Shipped** — `no-snap-back.spec.ts` samples the thumb and `aria-valuenow`, not `el.currentTime`

**Verified by** — **Mutation-proven**: both rows fail when the retain-until-changed rule is deleted — the mutation the old version survived
