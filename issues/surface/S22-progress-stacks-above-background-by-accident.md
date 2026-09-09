---
id: S22
title: "`Progress` stacks above `Background` by accident"
epic: surface
status: open
severity: P3
origin: review
breaking: false
---

— `Progress` carries a
`transform`, creating a stacking context. Silently inverts if a consumer overrides
`transform` (exactly what S20 invites). Give `Background` an explicit `z-index`.

## Where it stands

`Progress` stacks above `Background` only by accident — its `transform` creates a stacking context. A consumer who overrides `transform` (which **S20** invites) silently inverts them. Fix: an explicit `z-index` on `Background`.
