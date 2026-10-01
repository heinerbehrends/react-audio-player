---
id: B2
title: '"Only one player at a time" is a consumer concern'
epic: features
status: open
severity: none
origin: backlog
breaking: false
---

, and worth saying so. Two players with two playlists is a plausible route to overlapping audio. A library-owned `autoAdvance` would need cross-instance coordination — exactly the shared registry the per-`AudioPlayer` store avoids — so the shape stands: the library exposes state and control, the consumer owns the queue.

## Beta assessment (2026-10-01)

**Not blocking.** A documentation note, and the multi-instance E2E spec already
pins that two players are independent. Tracked from **G0**.
