---
id: P2-a
title: "The 250 ms transition is correctly composited, but promotes 4 unrelated elements to their own layers"
epic: performance
status: resolved
severity: P2
origin: review
breaking: false
evidence: [measured]
---

Good news, all measured: compositing reason is `ActiveTransformAnimation` (runs on the
compositor, `LayoutCount` = 0); **0 `transitioncancel`** over 8 s (inter-start gap ~256 ms vs
250 ms duration — the figure is well chosen); no re-rasterisation blur; CPU cost
**≈ 2.5 ms/s = 0.25 % of wall clock**.

New finding — **GPU memory**: layers 5 → **10**, texture **78.3 → 83.4 MB**. The 4 extra
promotions are `Overlap`-driven and include **both Volume slider buttons** — an unrelated
part of the UI. Because a transition starts every 256 ms, these layers persist for all of
playback. ~5 MB of GPU texture for a 250 ms cosmetic ease.
**`will-change: transform` is contraindicated** — it would make the transient 5 MB permanent
and buys nothing, since the transition is already composited.

## Where it stands

The 250 ms progress transition is correctly composited — measured: compositor-run, `LayoutCount` 0, zero `transitioncancel` over 8 s, ≈0.25 % of wall clock. The cost is GPU memory: layers 5 → 10, texture 78.3 → 83.4 MB, and the 4 extra promotions are `Overlap`-driven and include both Volume slider buttons, an unrelated part of the UI. A transition starts every ~256 ms, so those layers persist for all of playback. Recorded rather than actioned; **`will-change: transform` is contraindicated** — it would make the transient 5 MB permanent and buys nothing, since the transition is already composited.

## Beta assessment (2026-10-01)

**Not blocking.** Tracked from **G0**.

## Resolution

**Superseded by S33** (2026-10-06). The library no longer ships a progress
transition: S32 moved it from inline style to `styles.css`, and S33 removed it,
because a seek glided instead of jumping. No transition runs during playback,
so the extra layers and the ~5 MB of texture are gone with it.

The README keeps an opt-in glide snippet. A consumer who adds it takes on the
cost measured above, and the advice against `will-change: transform` still
holds for them.
