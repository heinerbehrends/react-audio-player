---
id: C5
title: "The ResizeObserver effect binds a node it can never re-bind"
epic: architecture
status: resolved
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

## Resolution

**Shipped** — The node is `useState`, not a ref, and the effect depends on it — the pattern `AudioElement` already used for the same reason. A remounted `.Control` now re-binds the observer and re-measures.

**Verified by** — 2 rows: the observer watches the node it was last given, and a resize of _that_ node updates `sliderLength`. Mutation-proven: pinning the deps back to `[measure]` fails both.
