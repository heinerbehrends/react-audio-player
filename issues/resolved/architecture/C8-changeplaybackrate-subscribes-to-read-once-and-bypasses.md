---
id: C8
title: "`ChangePlaybackRate` subscribes to read once, and bypasses the clamp"
epic: architecture
status: resolved
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

**Correction (2026-10-01):** "so nothing throws" was measured and is false in
Chromium, which rejects any non-zero rate below 0.0625. The clamp has to be the
browser's actual range for the decision above to hold — see **G2**, shipped
the same day.

## Resolution

**Shipped** (2026-10-05) — Both halves, with one change. `PlaybackRate.Change`
now sends `INCREASE_PLAYBACK_RATE` / `DECREASE_PLAYBACK_RATE`, the two actions
the `<` and `>` keys already use. They read the rate off the element at click
time, so the subscription to `rate` is gone and a `ratechange` no longer
re-renders the button; and they clamp to `RATE_BOUNDS`, so the button stops at
0.5 and 4 exactly as the keys and the slider arrows do — which is what its
JSDoc and the README had claimed all along. `PlaybackRate.Set` stays unclamped
to the library range on purpose: it names an explicit rate, and the write path
clamps to the browser's own (G2). The contract is now one sentence in the
README's Playback rate section.

**Verified by** — `clamps … to the library's 0.5–4 range, like the < and >
keys` and `does not re-render on a ratechange` in
`testJSDom/PlaybackRate/ChangePlaybackRate.test.tsx`; the existing `adds to the
rate the element reports after a ratechange` still passes, now because the
handler reads the element rather than because the button subscribed.
