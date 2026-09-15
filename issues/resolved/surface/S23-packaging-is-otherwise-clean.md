---
id: S23
title: "Packaging is otherwise clean"
epic: surface
status: resolved
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

## Resolution

**Shipped** — Both nits: `engines: { "node": ">=18" }`, the floor `useSyncExternalStore` and the toolchain already imply; and an ESM-only note in the README's **Requirements**, naming `ERR_REQUIRE_ESM` — the message a consumer actually sees, which says Node rather than this package — and `await import()` as the route from CommonJS.

`version: 0.0.0` is left alone: that is a release decision, not a packaging defect. `attw` was green and is unaffected by either change.
