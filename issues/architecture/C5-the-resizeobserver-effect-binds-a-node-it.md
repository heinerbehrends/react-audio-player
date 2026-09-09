---
id: C5
title: "The ResizeObserver effect binds a node it can never re-bind"
epic: architecture
status: open
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`useSlider.ts:135-169`. Deps are `[measure]`; the node comes from a ref, which cannot trigger
a re-run. If the semantic node is remounted (`{expanded && <Timeline.Seek/>}`, or a changed
`key`), the observer stays attached to a detached node forever and the slider never
re-measures. The fix is the pattern used one file over — `AudioElement.tsx:18-23` holds the
node in `useState` for exactly this reason.

## Where it stands

The `ResizeObserver` effect binds a node it can never re-bind — hold it in `useState` like `AudioElement` does.
