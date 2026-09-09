---
id: T4
title: "`retries: 2` is unconditional, and the comment says otherwise"
epic: tests
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`playwright.config.ts:16-17` — the comment reads "Retry on CI only" but the value is not
guarded (contrast `forbidOnly: !!process.env.CI` two lines above). With `workers: 1`, a
flaky row retries silently and reports green. The plan makes E2E a **blocking CI gate**, so
this converts "intermittently broken" into "passing".

## Resolution

**Shipped** — `retries: process.env.CI ? 2 : 0`. Verified against the thing the finding predicted: a `volume-state` row was seen failing then passing on retry during this work, so the masking was real rather than hypothetical — it did not reproduce in 8 repeats, and is recorded in `BACKLOG.md` against T7

**Verified by** —
