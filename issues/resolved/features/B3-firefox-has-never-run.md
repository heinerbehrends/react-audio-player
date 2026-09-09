---
id: B3
title: "Firefox has never run"
epic: features
status: resolved
severity: none
origin: backlog
breaking: false
---

`playwright.config.ts` had only a `chromium` project — **done**: both engines run in CI, 112 tests. The two failures were test bugs, not library bugs — Playwright's Firefox substitutes `clientX = 0` outside the viewport and dispatches no `pointerup` for a release outside it, so four sites now go through `insideViewport()`.

## Resolution

**Shipped** —

**Verified by** —
