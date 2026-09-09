---
id: S2
title: "`Time` is a plain object typed as a component"
epic: surface
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
also: [C6]
---

`TimeDisplay.tsx:92` is a **one-argument** `Object.assign`, which returns the object
unchanged. Confirmed: `typeof Time === "object"`, keys `['Elapsed','Remaining','Duration','Toggle']`.
`dist/index.d.ts` declares `type Time = React.FC<{children}> & {...}`, so `<Time>…</Time>`
type-checks and throws _"Element type is invalid… but got: object."_ The annotation is the
only reason it compiles. Every sibling compound casts a real root function; `Time` is the
only one with no root element. (Pre-existing — the Phase 5 `NamedExoticComponent → FC`
change preserved the existing lie rather than introducing it.)

## Resolution

**Shipped** — `Time` is a plain namespace object; the `React.FC` call signature is gone

**Verified by** — `dist/index.d.ts` declares an object; `<Time>` no longer type-checks
