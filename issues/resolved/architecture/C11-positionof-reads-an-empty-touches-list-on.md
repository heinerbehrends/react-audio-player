---
id: C11
title: "`positionOf` reads an empty `touches` list on `touchend`"
epic: architecture
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [verified]
---

Found while wiring the `touchend` listener **C9** asked for. `positionOf`
reads `event.touches[0]`, but a finger that has lifted is gone from `touches`
and left only in `changedTouches` — so `touchend` returned the `!touch`
fallback of `0`, the far end of a horizontal track.

Latent until now: `touchend` reached the function only through
`onTrackPointerDown`'s press-wait block, which registers it to _stop waiting_
and never reads a position from it. Adding it to the drag effect would have made
every touch-only drag commit at zero.

## Resolution

**Shipped** — `event.touches[0] ?? event.changedTouches?.[0]`. A finger still
down wins over one that has lifted, which is what a multi-touch gesture wants.

**Verified by** — 2 rows in `pointerPosition.test.ts`, plus the C9 row that
commits a drag at the lifted finger rather than at zero. Mutation-proven.
