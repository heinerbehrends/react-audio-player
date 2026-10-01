---
id: A10
title: "Nothing names or bounds the widget"
epic: accessibility
status: open
severity: P2
origin: review
breaking: false
evidence: [measured]
---

`AudioPlayer.tsx:17-27` renders no DOM
element — no landmark, no `role="region"`, no name. With two players on a page the AX trees
are byte-identical. Shared library/consumer responsibility.

## Where it stands

Nothing names or bounds the widget: `AudioPlayer` renders no element, so there is no landmark, no `role="region"` and no name. With two players on a page the AX trees are byte-identical. Shared responsibility — the library can offer the wrapper, the consumer has to name it.

## Beta assessment (2026-10-01)

**Decide before the beta — breaking later.** Adding a wrapper element after
consumers have laid out around `AudioPlayer` rendering nothing breaks every
flex and grid parent. Recommendation: keep no wrapper, and document
`role="region"` plus an accessible name on the consumer's own container. See
also **A16**, which only has an answer once this does. Tracked from **G0**.
