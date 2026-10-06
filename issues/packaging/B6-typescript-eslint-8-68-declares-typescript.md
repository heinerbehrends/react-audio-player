---
id: B6
title: "`typescript-eslint` 8.68 declares `typescript"
epic: packaging
status: open
severity: none
origin: backlog
breaking: false
---

> =4.8.4 <6.1.0`, which is why TypeScript is pinned at 6.0.3 rather than 7. Revisit when it widens.

## Beta assessment (2026-10-01)

**Not blocking.** TypeScript 6.0.3 type-checks all three projects clean.
Tracked from **G0**.

## Type-checking on TypeScript 7 (2026-10-06)

`pnpm type-check` now runs TypeScript 7.0.2, installed as the `typescript-7`
alias and called by path through the `tsc7` script: both packages ship a `tsc`
binary, and which one `node_modules/.bin` links is not defined. The four
projects check clean on it, in ~7 s against ~13 s on 6.0.3.

`typescript` stays at 6.0.3 for the tools that load the compiler API, which
7.0 does not ship (its package root exports only a version file):

- **typescript-eslint**: 8.71.1 and its canary still declare `<6.1.0`.
- **tsup's `.d.ts` build**.

`@arethetypeswrong/cli` bundles its own TypeScript and is unaffected. When
both of these support 7, drop the alias and the `tsc7` script, and bump
`typescript`.
