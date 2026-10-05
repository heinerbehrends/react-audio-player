---
id: S14
title: "Missing/mis-nested children fail silently"
epic: surface
status: resolved
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

## Correction (2026-10-05)

The nested case is not silent. React's development build warns on it
already — `validateDOMNesting(...): <button> cannot appear as a descendant of
<button>`, measured with react-dom 18 in jsdom — so the library has nothing to
add there. That leaves two cases for the warning: `.Control` omitted, which
is a structural check with no false positives, and a measured length of zero,
which also describes a legitimately hidden slider and so has to be gated on
the element being displayed.

## Resolution

**Shipped** (2026-10-05) as one development-only check. `useSlider` mirrors
the `.Control` ref into a boolean and, in a mount effect, logs a
`console.error` naming the root and its missing control when nothing
registered — refs attach before passive effects, so the check reads the
settled value. The branch sits behind `process.env.NODE_ENV !== "production"`,
the package's first and only such guard; the README's Timeline section says
so, and `SliderControl`'s JSDoc points at it. `SLIDER_MODES` gained
`rootName` for the message. The nested-button case is React's warning, and
the zero-height case is left to CSS, as every peer leaves it.

**Verified by** — two rows in `testJSDom/Slider/SliderControl.test.tsx`: a
`<Volume>` with only Background and Thumb logs exactly one error naming
`<Volume.Control>`, and a `<Timeline>` with its control logs nothing. Six
existing tests that rendered a part alone gained a control so the suite stays
quiet, and `useSlider.test.tsx` filters the one line because `renderHook`
mounts no control by construction. The built `dist/index.mjs` still contains
the literal `process.env.NODE_ENV`, so the consumer's bundler gets to strip it.
