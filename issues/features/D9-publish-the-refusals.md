---
id: D9
title: "Publish the refusals"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

This file reasons about what is deliberately
excluded better than most projects ever write down, and it does it where no
consumer will ever read it. A short "deliberately not included" section in the
README turns each of these from a recurring debate into a link: no queue or
playlist manager, no storage, no full `TimeRanges`, no video, no themes and no
bundled icons. Section 4 is the raw material; it wants a consumer-facing
paraphrase, not a copy.

## For the list (2026-09-15)

Four refusals settled while shipping **D1** and **S9**, each with a reason a consumer
will accept better than silence. The README already states the first two briefly — the
opening section for `asChild`, the props-hooks section for the slider hooks — so what is
wanted here is the consolidated "deliberately not included" section they can link to.

**No `asChild`.** Radix's merge rule is child-props-win, which inverts every lock this
library spreads last: `role="slider"`, `tabIndex={-1}`, `aria-hidden`, the
`aria-disabled` click gate. Implementing it honestly means a Slot with the opposite rule
— a prop people believe they know, behaving differently, with no signal at the call
site. It also costs bundle size for everyone, since `const Comp = asChild ? Slot :
"button"` names `Slot` unconditionally. The props hooks cover the same ground.

**No slider props hooks.** No design system owns an audio scrubber, so there is no
existing element to spread a bag onto; the bag would have to return a `ref`, which React
18 drops when spread onto a function component, leaving an unmeasured track that renders
normally and ignores every click; and the hook reads a private `SliderContext`, so it
could never be standalone anyway. `.Control` already takes `children`, `className` and
`style`, and composes handlers.

**`<button>` hosts only** for the six button hooks. The bag carries `type="button"` — a
real, wrong attribute on an `<a>` — and no `role` or `tabIndex`, and the media-key map
omits `Space` because a real button already activates on it. Supporting arbitrary
elements means owning keyboard activation, which is a headless-button primitive rather
than a props hook.

**No `data-disabled`.** Every button and `.Control` renders `aria-disabled="true"`, and a
slider root is reachable from it with
`[data-part="root"]:has([aria-disabled="true"])`. One state, one spelling. Worth listing
because its absence reads as an oversight otherwise — the README says so already, and
this section is where someone will look for the reason.

`render` is **not** on this list: it is deferred, not refused. Once the props bag is
public it is three lines on top of it and purely additive, so it waits for evidence that
wrapper-component fatigue is real.
