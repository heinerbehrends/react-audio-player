---
id: G1
title: "Nothing stops a stale or unversioned publish"
epic: release
status: resolved
severity: P0
origin: assessment
breaking: false
evidence: [measured]
---

Three gaps between a green tree and a publishable tarball, found on 2026-10-01:

- **`version` is `0.0.0`.** The first publish has to carry a real version, and
  a beta has to say so in the version, not only in the README.
- **No `prepublishOnly`.** `files` ships whatever `dist/` holds, and `dist/` is
  gitignored, so it is whatever the last local build left. On this machine the
  `.d.ts` was dated 2026-09-23 and the `.mjs` 2026-10-01 before a fresh build
  — a week of drift between two files that have to agree. `npm publish` would
  have shipped that pair without a word.
- **No CHANGELOG.** A beta is where breaking changes are expected, and the
  people taking them need one place that lists them. The resolved tickets
  marked **breaking** are the content.

What was fine: `npm pack --dry-run` lists 7 files and nothing stray; `attw`
passes with the `CJSResolvesToESM` warning deliberately ignored; the `"use
client"` banner survives the build.

## What to do

```json
"version": "0.1.0-beta.0",
"scripts": {
  "prepublishOnly": "pnpm type-check && pnpm build"
}
```

Publish with `pnpm publish --tag beta` so `latest` stays unset until 1.0. Add
`CHANGELOG.md` with a `0.1.0-beta.0` section seeded from the breaking tickets.

## Resolution

**Shipped** (2026-10-01) — `version` is `0.1.0-beta.0`, `prepublishOnly`
runs `pnpm type-check && pnpm build` so a publish cannot ship a stale
`dist/`, and `CHANGELOG.md` opens with the beta section. Nobody consumed the
package before this version, so the first entry lists what ships and the
documented gaps rather than a migration; the breaking-change history stays in
the resolved tickets.

The publish itself is a manual step: `pnpm publish --tag beta`, so `latest`
stays unset until 1.0.

**Verified by** — `pnpm pack --dry-run` on the new version lists the same 7
files plus `CHANGELOG.md`, which is in `files` because npm does not include it
on its own. `pack` does not run `prepublishOnly`; `pnpm publish` does.
