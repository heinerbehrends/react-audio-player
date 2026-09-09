---
id: A2
title: "No modifier-key guard — VoiceOver navigation drives the player"
epic: accessibility
status: resolved
severity: P0
origin: review
breaking: false
evidence: [measured]
---

`handleMediaKeys.ts:61` reads `keyToActionMap[event.key]` without checking
`ctrlKey`/`metaKey`/`altKey`. Observed with focus on Play:
`Control+Alt+ArrowRight` → `currentTime 0 → 5`; `Control+Alt+m` → muted;
`Control+p` → playback started, browser Print hijacked.
`Ctrl+Option` is the VoiceOver modifier, so every VO navigation command both fires a player
action and gets `preventDefault()`ed. _WCAG 2.1.1 (A)._
Fix: `if (event.ctrlKey || event.metaKey || event.altKey) return false;` at the top.
Note: WCAG 2.1.4 Character Key Shortcuts is **not** violated — shortcuts are focus-scoped.

## Resolution

**Shipped** — A `ctrlKey \

**Verified by** — \
