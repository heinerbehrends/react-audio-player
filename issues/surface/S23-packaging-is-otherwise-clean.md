---
id: S23
title: "Packaging is otherwise clean"
epic: surface
status: open
severity: P3
origin: review
breaking: false
evidence: [verified]
---

`attw` green for node16-from-ESM and bundler;
`exports` ordered correctly; `sideEffects: false` accurate. Nits: `version: 0.0.0`, no
`engines`, CJS `require()` fails with an opaque error and wants a documented ESM-only note.

## Where it stands

Packaging is otherwise clean — `attw` green, `exports` ordered, `sideEffects: false` accurate. The nits: no `engines` field, and `require()` fails with an opaque error where a documented ESM-only note would help.
