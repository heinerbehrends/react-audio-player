---
id: D2
title: "Refs on the parts. — additive, but it touches every public prop type"
epic: features
status: resolved
severity: none
origin: demand
breaking: false
evidence: [measured, verified]
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

## Beta assessment (2026-10-01)

**Decide before the beta — every prop type moves.** No part forwards a `ref`
today, and focus management on the play button is a day-one need. Additive for
consumers, but the beta is the cheap moment to change every public prop type at
once. Tracked from **G0**.

**Deferred past the beta** (decision, 2026-10-01). It is additive, so a later
release can add it without breaking anyone; the README roadmap lists it and the
changelog names the gap. Not in `0.1.0-beta.0`.

## Resolution

**Shipped** (2026-10-06). Every part that renders an element forwards a
`ref` to it, with `forwardRef` so React 18 stays supported. `.Control` merges
the caller's ref with the one it measures the track through, so a ref of yours
does not stop it measuring. The three identical slider backgrounds are now one
shared part.

Two things the wrappers broke, both fixed:

- **Tree-shaking.** A top-level `forwardRef()` call, and a static assigned onto
  its result, are side effects to a bundler, so an unused part stayed in: "AudioPlayer only" went from
  2576 B to 8316 B. Each call is now `/* @__PURE__ */`, and the compound
  statics are attached by one pure `Object.assign`. The build no longer runs
  esbuild's whitespace pass, which strips every comment, the annotations
  included; the syntax and identifier passes still run.
- **Docs.** `Time` is an object of parts, and the declaration emitter inlines
  a `forwardRef` member's type, losing the JSDoc on its `const`. The docs
  moved onto the object's properties, where the `.d.ts` keeps them.

Cost, gzipped, against the commit before: "PlayButton only" +31 B, "MuteButton
only" +32 B, "Time only" +28 B, "Timeline only" +101 B, "AudioPlayer only" 0,
"Full surface" +81 B (budget raised from 8700 to 9200).

**Verified by** — `testJSDom/Shared/refs.test.tsx`: each of the 22 parts
hands its ref its own element, `ErrorMessage` while it shows, and
`Timeline.Control` still measures with a ref of the caller's. Every part's
JSDoc checked present in `dist/index.d.ts`.
