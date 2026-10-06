---
id: C15
title: "Review the comments consumers never see"
epic: architecture
status: open
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

The counterpart of **G5**, which reviews the doc comments that reach
`dist/index.d.ts`. This one is everything else: inline comments and docs on
internal code in `src`, and the comments in the tests and scripts. Nobody
outside the repo reads them, so they matter less, but they are what a
contributor reads first, and they have grown the same way.

Measured on 2026-10-06, comment lines of all lines:

| Folder      | Comment lines | Share | With a ticket ID |
| ----------- | ------------- | ----- | ---------------- |
| `src`       | 1706 of 5477  | 31 %  | 84               |
| `testJSDom` | 1069 of 11576 | 9 %   | 107              |
| `testE2E`   | 331 of 2823   | 11 %  | 12               |
| `scripts`   | 191 of 893    | 21 %  | 11               |

`src` includes the 755 public lines G5 covers, so about 950 are internal.
Comparable libraries sit near 2–3 % in their source.

## Check each comment for

- **Still true**, after the day's changes to the store, the sliders and refs.
- **Needed:** an inline comment earns its place with something the code cannot
  say: a browser fact, a deliberate absence, an ordering constraint, or why the
  obvious alternative was not taken. Anything else goes.
- **No ticket IDs.** The reason stays, the ID goes.
- **One home.** A fact explained in a public comment or a ticket is not
  repeated inline.

Test comments that say why a case exists stay; ones that narrate the steps go.

## Done when

- `src` is read in full; tests and scripts at least for stale comments and
  ticket IDs.
- No comment outside `issues/` cites a ticket ID.
- Lint, type-check and the test suites pass, so only comments changed.
