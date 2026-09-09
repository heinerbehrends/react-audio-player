---
id: D1
title: "Polymorphism: `asChild`, or a `render` prop"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

The README pitches the library as composed the way Radix is, and the most-used
thing in that API is missing: there is no `asChild`, no `render` prop and no
Slot anywhere in `src/`. Anyone with a design system reaches for it in the first
hour, because `PlayButton` renders a `<button>` they already have a styled
version of.

The field has split on which convention to offer, so this is a choice and not a
lookup: Radix keeps `asChild`, and Base UI went stable in December 2025 with
`render` instead, explicitly to avoid `asChild`'s prop-merging ambiguity around
event handlers and refs. Either is defensible. Deciding after publish is not —
it means shipping both, or breaking the prop type of all ten roots and their
members at once.

The merge semantics are the work, not the prop. Every part here already composes
handlers deliberately (`composeEventHandlers`), and the disabled rule — an
`aria-disabled` control swallows the consumer's own `onClick` — has to survive
being merged onto someone else's element.
