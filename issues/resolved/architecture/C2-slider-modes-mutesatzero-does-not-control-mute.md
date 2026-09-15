---
id: C2
title: "`SLIDER_MODES.mutesAtZero` does not control mute-at-zero"
epic: architecture
status: resolved
severity: P1
origin: review
breaking: false
evidence: [code-reading]
---

Its two uses (`useSlider.ts:237-241,264-268`) only unmute-on-grab and pin the memory. The
actual zero rule is keyed off `action.component === "volume"` in
`handleSideEffect.ts:60-70`. So "is this the volume slider?" is answered twice, in two
layers, and the mode table — whose stated purpose is one discriminant in one place — is only
half the answer. Either move the rule up, or rename the flag to `unmutesOnGrab`.

## Where it stands

`SLIDER_MODES.mutesAtZero` does not gate mute-at-zero; the real rule is keyed off `action.component` in another layer.

## Resolution

**Shipped** — Renamed, not moved: the flag is `unmutesOnGrab`, which is what its two uses do. Moving the zero rule up into the mode table was the other option and is wrong — the rule has to hold for a consumer's own `CHANGE_VALUE`, which never passes through `useSlider`, so it stays in `handleSideEffect` keyed off `action.component`. The table's doc comment now says both halves out loud, so the split reads as a decision rather than an oversight. Internal name; nothing exported moved.

**Verified by** — the existing volume-pin block, 6 rows, unchanged.
