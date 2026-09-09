---
id: F5
title: "No buffering state at all"
epic: features
status: resolved
severity: P1
origin: review
breaking: false
evidence: [code-reading]
---

`HANDLERS` has no `waiting`, `playing`, `stalled`,
`progress` or `canplay` row; `SyncableMediaElement` has no `buffered`/`seekable`/
`networkState`. The trap is worse than a missing spinner: `loadState` flips to `"ready"` at
`readyState >= 1` (HAVE_METADATA), so a player with metadata and zero audio data reports
`"playing"`. Mid-track rebuffering is invisible.
P1-and-pre-1.0 because `PlayerState` is a union consumers will switch on exhaustively —
adding `"buffering"` later is breaking.
Architecture makes this **easy**: `HANDLERS` is a table you add rows to.

## Resolution

**Shipped** — Stall signal: `readyState` projected, `useIsBuffering()` derives from it. Chosen over a 5th `PlayerState` member, which would have destroyed the play/pause affordance during a stall

**Verified by** —
