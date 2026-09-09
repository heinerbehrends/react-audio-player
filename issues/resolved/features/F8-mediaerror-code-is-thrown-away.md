---
id: F8
title: "`MediaError.code` is thrown away"
epic: features
status: resolved
severity: P2
origin: review
breaking: false
evidence: [verified]
---

`syncFromElement.ts:142-144` collapses the
error to `loadState = "error"` and never reads `el.error`, so consumers cannot distinguish
`MEDIA_ERR_NETWORK` (retry) from `MEDIA_ERR_SRC_NOT_SUPPORTED` (don't).

## Resolution

**Shipped** — `mediaErrorCode` projected; `useAudioError()` composes it with `playbackError` into a discriminated union

**Verified by** —
