---
id: F1
title: "No way to read player state"
epic: features
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
also: [S13]
---

`src/index.ts` exports components and three types —
no hook, and `AudioPlayerProps` has no `onPlay`/`onPause`/`onEnded`/`onTimeUpdate`/`onError`
and no `ref`. A consumer cannot render "2:14 / 5:03" in their own header, log analytics, or
react to a track finishing. The only escape hatch in the library is
`customKeyboardShortcuts`, which is write-only.
This also makes the README's own advice impossible: `README.md:152-154` says to "gate any UI
that needs a length on a duration greater than zero" — `duration` is unreachable.
Smallest fix: one `useAudioPlayer()` hook. `readable()` already strips `set`, so the
projection invariant survives. ~15 lines.

## Resolution

**Shipped** — `useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsBuffering`, `useAudioError`

**Verified by** — 10 tests, two of which pin the subscription-granularity split
