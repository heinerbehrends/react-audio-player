---
id: T5
title: '`CurrentIndicator` "renders with current rate" cannot fail'
epic: tests
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured]
---

`PlaybackRate.test.tsx:56-64` asserts `toBeInTheDocument()`, but `CurrentIndicator` renders
children in **both** branches (`SetPlaybackRate.tsx:41-50` — the non-current branch is a
`visibility: hidden` span). The element's rate is actually `1`, so the component is in the
_not_-current branch while the test name claims otherwise.
Root cause: a **stale mock** of `useAudioElement`, a module deleted in `f006e51`. ✅
Confirmed the module no longer exists. `AudioPlayer.test.tsx:82-84` has the same dead mock
of `useHandleSideEffect`. ✅

## Resolution

**Shipped** — The other half: the dead `useAudioElement` mock in `PlaybackRate.test.tsx` is gone, and `.Current`'s row asserts _visibility_ rather than presence — the component renders children in both branches, so `toBeInTheDocument()` could not tell them apart. The row also sets the element's rate, so its name is finally true

**Verified by** —
