---
id: D2
title: "Refs on the parts. — additive, but it touches every public prop type"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

`audioRef` reaches the `<audio>` element, which is the hard case and is already
solved. No _part_ forwards a ref: there is no `forwardRef` in `src/`, and the
types pin React 18, where `ref` is not an ordinary prop. Tooltips, popovers,
scroll-into-view, measurement and every animation library want an element
handle, and `Timeline.Control` is the one they want it on.

Coupled to **S19**: React 19 makes `ref` a plain prop and deletes the
`forwardRef` ceremony, so the shape of this depends on which React the types
target. **S19 has landed, and it settles the shape rather than leaving it open:**
the matrix verifies both ends of `>=18.0.0`, so the types have to keep working
on 18 and `forwardRef` is still what has to be written. Dropping the ceremony
means dropping React 18, which is its own decision and not part of this.
