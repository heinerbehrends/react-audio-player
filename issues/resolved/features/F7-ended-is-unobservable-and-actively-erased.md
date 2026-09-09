---
id: F7
title: "`ended` is unobservable and actively erased"
epic: features
status: resolved
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

`AudioElement.tsx:44` rewinds to 0;
`usePlayerState` has no `"ended"` member. After a track finishes the UI is byte-identical to
"never started" — no replay affordance, no autoplay-next, no completion analytics. The
rewind is correct — the refactor plan set it out, and `AudioElement`'s `onEnded`
handler is where it lives; the fix is an additive atom.

## Resolution

**Shipped** — `onEnded` on `AudioPlayer` makes track-end observable, and userland playlists possible. The original row rejected an `ended` atom because the rewind cleared `el.ended` within a tick — that reasoning went with the rewind. Answered instead by `useIsAtEnd()`, a derivation: `onEnded` is the edge ("advance now"), `useIsAtEnd` the level ("the position is the end"), and they are different questions rather than competing answers

**Verified by** —
