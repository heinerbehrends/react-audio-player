---
id: S6
title: "`audioFiles` array shape + `AudioFile` missing `type`"
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
also: [F2]
---

See **P1/P3** in
[Product](#3-product--feature-gaps). Listed P0 here because the _prop shape_ freezes on
publish.

## Resolution

**Shipped** — `audioFiles: AudioFile[]` → `audioFile: AudioFile`

**Verified by** — The array never read past `[0]`
