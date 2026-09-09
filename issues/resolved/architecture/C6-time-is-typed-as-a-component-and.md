---
id: C6
title: "`Time` is typed as a component and is not one"
epic: architecture
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
also: [S2]
---

Same as **S2**.

## Resolution

**Shipped** — `Time` is a plain namespace object; the `React.FC` call signature is gone

**Verified by** — `dist/index.d.ts` declares an object; `<Time>` no longer type-checks
