---
id: S18
title: "`react-dom` is an unnecessary peer dependency"
epic: surface
status: resolved
severity: P2
origin: review
breaking: false
evidence: [verified]
---

0 references in the bundle.

## Resolution

**Shipped** — `react-dom` dropped from `peerDependencies`. It stays a devDependency — the demo app mounts with it, the jsdom suite renders with it — and stays in tsup's `external`, now as a guard rather than a declaration: if anything ever does import it, the import is left for the consumer's renderer instead of bundling a second React DOM.

**Verified by** — Zero references to `react-dom` in `dist/index.mjs` or `dist/index.d.ts`, confirming the finding's ✅. `build` and `check-exports` (`attw`, esm-only profile) green after the change.
