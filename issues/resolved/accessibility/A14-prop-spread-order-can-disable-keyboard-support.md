---
id: A14
title: "Prop-spread order can disable keyboard support"
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: false
evidence: [verified]
also: [S5]
---

`SetSliderValue.tsx:29-37` — `{...props}` lands after the handlers, `tabIndex` and every
`aria-value*`, but _before_ `role`. So the invariants that matter for operability are the
overridable ones. `DragButton.tsx:18-20` has the mirror problem with `tabIndex={-1}` and
`aria-hidden`.

## Resolution

**Shipped** — `composeEventHandlers`; handlers, `tabIndex` and `aria-hidden` moved after the spread

**Verified by** — 11 tests, including the `preventDefault()` opt-out
