---
id: S26
title: "The `hidden` attribute does not hide a slider"
epic: surface
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's minimal example (D8), hiding its volume slider in a
narrow player. Every slider root spreads `rootStyles`, whose inline
`display: grid` outranks any stylesheet rule — a class's `display: none`, and
also the user-agent rule behind the `hidden` attribute. So `<Volume hidden>`
stayed on screen, though `hidden` is the standard way to hide an element.

The grid itself stays inline: it is how the layers stack, and moving it to the
optional `styles.css` would break every slider rendered without it. Putting it
on an inner element instead would free the root entirely, at the cost of an
extra element in every slider; not worth it for this case alone.

## Resolution

**Shipped** (2026-10-05). The three roots spread `rootStylesFor(props.hidden)`,
which swaps `display: grid` for `display: none` while `hidden` is set. The
README's "What stays inline" section says so, and that hiding a root from CSS
takes `display: none !important` or a wrapper. The minimal example hides its
volume slider in a container query with `!important`, and lost its wrapper.

**Verified by** — a jsdom test per root in `dataAttributes.test.tsx`: hidden
while the attribute is set, `grid` again once it is removed.
