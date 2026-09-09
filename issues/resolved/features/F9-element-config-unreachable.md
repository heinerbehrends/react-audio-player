---
id: F9
title: "Element config unreachable"
epic: features
status: resolved
severity: P2
origin: review
breaking: false
also: [S10]
---

— `crossOrigin`, `preload`, `loop`, `autoPlay`. ✅
Same root cause as S10. `crossOrigin` is the sharp one: it blocks every Web Audio visualiser
with no workaround. `loop` has no action at all and is roadmapped.

## Resolution

**Shipped** — `audioProps` and `audioRef` on `AudioPlayer` — unblocks `crossOrigin` (and so Web Audio), `preload`, `<track>` captions and HLS.js

**Verified by** —
