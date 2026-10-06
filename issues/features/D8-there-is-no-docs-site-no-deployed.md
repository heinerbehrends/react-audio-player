---
id: D8
title: "There is no docs site, no deployed demo and no sandbox link"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

For a
headless library this is _the_ adoption gap, because there is nothing else to
look at: the markup is the consumer's, so the documentation is the product.
Radix and Base UI are chosen off their docs sites. The README here is
better-reasoned than most libraries' entire documentation, and it is 19 kB of
prose that someone comparing five players in an afternoon will not read. One
deployed page with four working players — minimal, podcast, waveform,
mini-player — each with copyable source, outperforms any three features above.
`public/The-Race.mp3` and the Vite dev app are most of the fixture already.

## Beta assessment (2026-10-01)

**Not blocking.** The README carries every example the beta needs. A deployed
demo would help the beta announcement more than the beta itself. Tracked from
**G0**.

## Planned (2026-10-05)

`plans/PLAN-demo-site.md`. Examples live in the repo as standalone Vite projects
under `examples/`; a demo app renders them against `src/` and deploys to GitHub
Pages, and each "Open in StackBlitz" link opens the same folder from GitHub, so
there is one copy of each example and CI covers it. The lineup is basic (on
`styles.css`), playlist, podcast and waveform; the waveform needs no library
change, spiked the same day. Sandbox links wait for the beta publish.

## Added (2026-10-06): a multi-player example

A fifth example, several players on one page. Planned with the others in
`plans/PLAN-demo-site.md`, phase 5.
