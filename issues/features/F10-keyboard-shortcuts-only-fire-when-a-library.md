---
id: F10
title: "Keyboard shortcuts only fire when a library button has focus"
epic: features
status: open
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

The default map is
`space`, `j`/`k`/`l`, `0`-`9`, `<`/`>` — unmistakably YouTube's _global_ vocabulary, so
readers will assume page-wide. Suggested: a `keyTarget="document"` prop.

## Where it stands

The shortcuts fire only when a library control has focus, but the default map (`j`/`k`/`l`, `0`–`9`, `<`/`>`) is YouTube's _global_ vocabulary, so readers assume page-wide. Suggested: a `keyTarget="document"` prop. Deferred because a document-level listener is the library reaching outside its own DOM, and needs an opt-in story for two players on a page.
