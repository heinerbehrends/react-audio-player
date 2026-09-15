---
id: C9
title: "The drag effect registers `touchcancel` but not `touchend`"
epic: architecture
status: resolved
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

`useSlider.ts:334-384` — while the press-wait block in `onTrackPointerDown` registers
`touchend`. Probably covered by `pointerup` on modern browsers, but the asymmetry between
the two listener sets is unexplained.

## Where it stands

The drag effect registers `touchcancel` but not `touchend`, while the press-wait block registers `touchend`.

## Resolution

**Shipped** — `touchend` added to the drag effect, so the two listener sets match. It needed a guard: `pointerup` and `touchend` both fire for one finger, in the same task, before React can re-render and take the listeners down — so `end` and `cancel` each run once per gesture now.

**Found while fixing it** — [[C11]]. `positionOf` read `touches[0]`, which is empty on `touchend`, so the listener this ticket asked for would have committed at position 0. It was worth having the ticket asymmetry explained rather than assumed.

**Verified by** — 3 rows: a drag ended by `touchend` alone, one committing at the lifted finger rather than at zero, and one firing both end events in a single flush and finding exactly one `CHANGE_VALUE`.
