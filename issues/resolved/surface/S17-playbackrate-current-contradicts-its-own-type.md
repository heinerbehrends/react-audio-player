---
id: S17
title: "`PlaybackRate.Current` contradicts its own type"
epic: surface
status: resolved
severity: P2
origin: review
breaking: true
evidence: [code-reading]
---

Declared
`React.ReactElement | null` but the non-current branch returns
`<span style={{visibility:"hidden"}}>` (`SetPlaybackRate.tsx:49`), never `null` — it
occupies layout space, which the README doesn't hint at.

## Resolution

**Shipped** — The reserved space is kept and the type corrected to `React.ReactElement` — and the wrapper span is now unconditional, which the finding did not ask for and the reasoning demands: with a fragment in the current branch, the marker itself was the flex or grid item, so the row reflowed every time the marker moved, which is the reflow the hidden span exists to prevent. Returning `null` was rejected for the same reason.

**Verified by** — **Mutation-proven**: a new row asserts a `SPAN` wrapper in both states, and restoring the fragment branch fails it, since `parentElement` is then the render container. The three existing rows — shown, hidden, and matched-within-0.001 — pass unchanged, so the visible behaviour is pinned as it was. README now states that the marker reserves its space in both states.
