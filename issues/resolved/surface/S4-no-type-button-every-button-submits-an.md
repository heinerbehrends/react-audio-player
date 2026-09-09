---
id: S4
title: 'No `type="button"` — every button submits an enclosing form'
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

0 hits in `src/`.
Worse, `PlayButton.tsx:7`, `SetSliderValue.tsx:8` and `DragButton.tsx:4` are typed
`React.HTMLAttributes<HTMLButtonElement>` rather than `ButtonHTMLAttributes`, so `type`,
`disabled`, `form`, `name` and `value` are all type errors — the consumer cannot patch it
without `@ts-expect-error`. `MuteButton` and `Seek` use the right type, so this is
inconsistent as well.

## Resolution

**Shipped** — `type="button"` on all 8 buttons; 3 prop types widened to `ButtonHTMLAttributes`

**Verified by** — Browser DOM
