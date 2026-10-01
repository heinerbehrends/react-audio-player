---
id: S14
title: "Missing/mis-nested children fail silently"
epic: surface
status: open
severity: P1
origin: review
breaking: false
evidence: [code-reading]
---

Omitting `Timeline.Seek` leaves
geometry at `{0,0}`: thumb parks at `-20px`, clicks do nothing, no `role="slider"`, no aria,
no tab stop, **no warning**. Nesting `Timeline.Drag` inside `Timeline.Seek` produces
`<button>` inside `<button>`. Suggested: dev-only warnings, stripped in production.
_Good news:_ the existing context guards (`SliderContext.tsx:32-35`) have genuinely
excellent messages.

## Where it stands

Missing or mis-nested children fail silently. Omit `.Control` and the geometry stays at `{0, 0}`: no `role="slider"`, no aria, no tab stop, clicks do nothing, no warning. Nest `.Thumb` inside `.Control` and you get a `<button>` inside a `<button>`. Wants dev-only warnings, stripped in production. The existing `SliderContext` provider guards show the standard to match.

## Beta assessment (2026-10-01)

**Fix before the beta.** This is the failure a beta user hits first, and it
produces no error at all. One dev-only warning when the measured slider length
is still zero after mount covers all three cases — `.Control` omitted,
`.Thumb` nested inside it, and a root with no height — and is stripped in
production. Tracked from **G0**.
