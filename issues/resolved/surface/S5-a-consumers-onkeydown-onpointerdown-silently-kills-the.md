---
id: S5
title: "A consumer's `onKeyDown`/`onPointerDown` silently kills the slider"
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
also: [A14]
---

`SetSliderValue.tsx:29-37`, `DragButton.tsx:17-21` — `{...props}` wins over the library
handlers. `<Timeline.Seek onKeyDown={analytics}>` removes arrow-key seeking and all media
shortcuts. Radix solves this by composing handlers unless `event.defaultPrevented`.
(Same defect as **A14**, from the DX side.)

## Resolution

**Shipped** — `composeEventHandlers`; handlers, `tabIndex` and `aria-hidden` moved after the spread

**Verified by** — 11 tests, including the `preventDefault()` opt-out
