---
id: S3
title: 'No `"use client"` directive — breaks the Next.js App Router'
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

0 hits in
`dist/index.mjs`. The library is entirely `useState`/`useEffect`/`useSyncExternalStore`, so
importing it from a Server Component throws at build time. Fix: `banner: { js: '"use client";' }`
in `tsup.config.ts`.

## Resolution

**Shipped** — `"use client"` via tsup `banner` **plus** an `onSuccess` re-apply

**Verified by** — First line of `dist/index.mjs`; the Rollup treeshake pass strips the banner alone
