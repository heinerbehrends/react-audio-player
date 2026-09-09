---
id: T11
title: "Change-detector tests"
epic: tests
status: resolved
severity: P2
origin: review
breaking: false
---

`calculateStyle.test.ts:163-191` asserts constants equal
themselves; `:83-95` is a character-for-character duplicate of `:70-81`; four
`"should export all subcomponents"` rows assert `toBeDefined()` on statically-typed
properties. Thin but harmless — only the duplicate is worth deleting.

## Resolution

**Shipped** — The character-for-character duplicate in `calculateStyle.test.ts` is deleted. The rest was assessed and kept: on a second look the `rootStyles` rows are not change-detectors — they pin S8's rule that opinion lives in `styles.css`, which regresses the moment a property moves back inline

**Verified by** —
