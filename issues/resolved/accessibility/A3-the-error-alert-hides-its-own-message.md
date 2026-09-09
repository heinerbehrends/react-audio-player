---
id: A3
title: "The error alert hides its own message from AT"
epic: accessibility
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

`src/Player/ErrorMessage.tsx:14-21` puts `aria-hidden="true"` on the `<div>` holding
`{children}`, inside a `role="alert" aria-live="assertive"` with a hardcoded English
`aria-label`. A live region is announced from its _content_; all content is hidden, so the
region is empty. The consumer's message — the only customisable part — is the thing
suppressed. _WCAG 4.1.3 Status Messages (AA)._
Fix: drop both the `aria-hidden` wrapper and the `aria-label`.

## Resolution

**Shipped** — `aria-hidden` wrapper and `aria-label` removed from the alert

**Verified by** — Browser: message announceable; the test that pinned the bug was flipped
