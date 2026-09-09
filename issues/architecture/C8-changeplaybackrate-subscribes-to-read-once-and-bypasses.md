---
id: C8
title: "`ChangePlaybackRate` subscribes to read once, and bypasses the clamp"
epic: architecture
status: partial
severity: P2
origin: review
breaking: false
evidence: [verified]
---

`ChangePlaybackRate.tsx:39-45` subscribes to `rate` only to supply a value at click time, so
every `ratechange` re-renders the button; `store.rate.get()` in the closure does the same
with no subscription. And `SET_PLAYBACK_RATE` is **unclamped**
(`handleSideEffect.ts:78-81`), so `<PlaybackRate.Change>` walks past 4 while the `>` key and
the slider arrows stop at 4 — same value, two policies.
Note: the comment justifying the subscription describes the _pre-refactor_ hazard; `.get()`
in a handler is neither a render read nor a subscription.

## Where it stands

The 0.5–4 playback-rate policy is applied inconsistently: the slider arrows and the `>` key clamp there, `SET_PLAYBACK_RATE` does not. The write path now clamps to the browser's [0, 16] so nothing throws, but the library's own range is still unenforced — deliberately, since `<PlaybackRate.Set rate={8}>` names an explicit rate. Decide whether that is the intended contract.

## Resolution

**Shipped** — The write path clamps `playbackRate` to the browser's own range, so no rate write can throw. Verified by 9 clamp tests, including the two `NaN`-before-metadata paths

**Verified by** —
