---
id: S15
title: "`SideEffectAction` is too broad for its one public use"
epic: surface
status: resolved
severity: P1
origin: review
breaking: true
evidence: [code-reading]
---

Exported only because
`KeyToActionMap` needs it, but the union includes `CHANGE_VALUE` (which references
`SliderComponent` — declared in `dist/index.d.ts:5` but **not exported**, so a consumer can
build the value but cannot name its type) and `AUDIO_FILE_ENDED`. Suggested: a narrower
`KeyboardAction`.

## Resolution

**Shipped** — `KeyboardAction` (16 members) exported in place of `SideEffectAction` (18); `KeyToActionMap` uses it. `CHANGE_VALUE` and `AUDIO_FILE_ENDED` are no longer bindable. Verified in `dist/index.d.ts`: the unexported `type SliderComponent` declaration is gone, so the finding's second half — export it — became unnecessary rather than done

**Verified by** —
