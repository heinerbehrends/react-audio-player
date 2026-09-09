---
id: F4
title: "`play()` rejection is dropped"
epic: features
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

`handleSideEffect.ts:21,30` call bare
`audioElement.play()` — no `.catch`. Two common paths: **autoplay blocked**
(`NotAllowedError`, every mobile browser) gives an uncaught rejection and no signal, so the
UI cannot render "tap to play"; and **`AbortError`** on any rapid `TOGGLE_PLAY` — a
double-click or a held `p` key. The store's write-only invariant means the `.catch` cannot
set an atom directly; `SideEffectContext` is the sanctioned channel.

## Resolution

**Shipped** — `playbackError` atom written by `send`; `AbortError` swallowed

**Verified by** — 15 tests, incl. one asserting no unhandled rejection escapes
