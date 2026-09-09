---
id: S19
title: "React 19 untested"
epic: surface
status: resolved
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

No blocker found on inspection (the `AudioElement.tsx:28-30`
ref callback correctly returns `undefined`), but devDeps pin React 18 and there is no CI
matrix, so `>=18.0.0` is unverified.

## Resolution

**Shipped** — A `react-version: ["18", "19"]` matrix over the whole gauntlet, `fail-fast: false` so a failure at one end of `>=18.0.0` cannot cancel the run that would have judged the other. The 19 leg installs `react`, `react-dom` and both `@types` over the lockfile, which pins 18 — `react-dom` in lockstep, since it is no longer a peer dependency (**S18**) but the demo mounts with it.

**Verified by** — Run in a worktree on React **19.2.8** before the leg was written, which is what turned this finding's 📖 into a measurement. Type-check found exactly **one** difference, and it was in a test rather than in library code: `audioRef={(node) => seen.push(node)}`, since React 19 types a ref callback's return as a cleanup function and a concise arrow returning `push`'s number no longer fits. Fixed to a statement body, valid under both. The type is the guardrail worth having — a callback that returned an actual function would be taken as a cleanup silently. Then **504 jsdom and 112 E2E green on 19**, both engines, and the same on 18. `assignRef` needed nothing, as the finding predicted.
