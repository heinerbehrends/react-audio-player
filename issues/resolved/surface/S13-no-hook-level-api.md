---
id: S13
title: "No hook-level API"
epic: surface
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
also: [F1]
---

`usePlayerState`, `useVolumeState`, `useIsDisabled`,
`useTimeDisplay` all exist in `src/store/derived.ts` and none reach `src/index.ts`.

## Resolution

**Shipped** — `useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsBuffering`, `useAudioError`

**Verified by** — 10 tests, two of which pin the subscription-granularity split
