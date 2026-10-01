---
id: P3
title: "The tree-shaking win has no automated guard"
epic: performance
status: resolved
severity: P2
origin: review
breaking: false
evidence: [measured, verified]
---

**P1-a** found a `PlayButton`-only import costing 4,025 B gzipped — 66 % of the library —
because a barrel re-export and three `Object.assign` compound roots pulled every component
into every bundle. The fix took it to 1,137 B.

Nothing holds it there. The property is structural — no barrel, no shared string table, each
component owning its own literals — and it is invisible to the type checker, the test suite
and the linter. **A15** then put 16 translatable strings behind that same rule, deliberately
refusing a central `defaultLabels` object because one would have dragged all sixteen into
every bundle that touched any of them.

So the guard against undoing a 3x win is a paragraph of reasoning in two resolved tickets
and a byte count someone has to remember to re-measure by hand. A refactor to a shared
defaults module is the obvious tidy-up, reads better than what is there, and would be caught
by nothing.

Surfaced while reviewing A15: the partial-bag test in `testJSDom/labels/` carried a comment
claiming it would catch exactly that refactor. It would not — a merged defaults table
renders byte-identical output, so the test pins the behaviour every implementation shares.
The comment has been corrected; this ticket is the missing half.

## Resolution

**Shipped (2026-10-01)** — `scripts/bundle-size.mjs`, wired to `pnpm size` and to its own CI
job.

Five entry points are rolled up against `dist/index.mjs` with React external, minified with
esbuild and gzipped at level 9 — P1-a's own method, so the numbers are comparable to the
ones in that ticket:

| entry point       | gzip    | ceiling | headroom |
| ----------------- | ------- | ------- | -------- |
| `PlayButton` only | 1,273 B | 1,500 B | 15 %     |
| `MuteButton` only | 1,286 B | 1,500 B | 14 %     |
| `Timeline` only   | 3,873 B | 4,500 B | 14 %     |
| `Time` only       | 1,561 B | 2,500 B | 38 %     |
| full surface      | 7,533 B | 8,500 B | 11 %     |

**The ceilings are deliberately loose**, ~15 % above today. The number drifts whenever
rollup or esbuild change their output, and a budget that trips on a toolchain bump gets
raised reflexively until it means nothing. What it has to catch is an order of magnitude
larger: the P1-a regression was ~2.6 kB on a single button.

**A byte budget alone would still miss a small leak**, so each single-component entry is also
probed for strings that belong to another component — `"Volume slider"` in a `PlayButton`
bundle, and so on. A probe hit fails the row even when it is under budget. Proven both ways:
pointing the `PlayButton` entry at `{ PlayButton, Volume }` with the ceiling raised to 9,000 B
passes the size check and still fails, naming all three foreign strings.

**Cost.** ~440–540 ms of work, 124 MB peak RSS, ~30 ms per additional entry point. No new
install cost — `rollup` and `esbuild` were already in the tree as transitive dependencies of
vite and tsup, and are now explicit devDependencies, which pnpm dedupes against what it had
already downloaded (`pnpm add` reported 0 downloaded). No new build cost in the job, which
runs `pnpm build` as its only setup.

**Its own CI job, not a step in `test`.** It needs the build and nothing else — no browsers,
no matrix — so as a step it would have queued behind the Playwright install and the E2E suite
to report a number that takes half a second to compute. In parallel it is the first thing to
go red. One leg only: React is external to the bundle, so the count is identical under React
18 and 19, and running both would double the cost to produce two identical reports.

**A failure is not an instruction to make the bundle smaller.** It means something new
reached those modules; the fix is to find what, which the string probes usually name
outright.

**Verified by** — `scripts/bundle-size.mjs` itself, exercised in both directions (clean run
exits 0; a deliberately leaky entry point exits 1 and names the foreign strings).
