---
id: S22
title: "`Progress` stacks above `Background` by accident"
epic: surface
status: resolved
severity: P3
origin: review
breaking: false
---

— `Progress` carries a
`transform`, creating a stacking context. Silently inverts if a consumer overrides
`transform` (exactly what S20 invites). Give `Background` an explicit `z-index`.

## Where it stands

`Progress` stacks above `Background` only by accident — its `transform` creates a stacking context. A consumer who overrides `transform` (which **S20** invites) silently inverts them. Fix: an explicit `z-index` on `Background`.

## Resolution

**Shipped** — The stack is declared: `.Background` `z-index: 0`, `.Progress` `1`, `.Thumb` `2`. Grid items take a `z-index` without being positioned, so no `position` was added to get one.

That is the order the parts already painted in, so nothing moves on screen. What changed is why: the fill used to win only because its `transform` makes a stacking context, so a consumer overriding `transform` — which **S20** invites — silently put the background on top. The thumb is in the list because a fill at `z-index: 1` would otherwise have painted over it.

Documented in the README under **Styling → What stays inline**.

**Verified by** — 3 rows in `calculateStyle.test.ts`, one of which overrides the fill's `transform` and finds the order intact.
