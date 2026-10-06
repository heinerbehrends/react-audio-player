---
id: G4
title: "The README is a reference dump, not documentation"
epic: release
status: open
severity: P0
origin: backlog
breaking: false
evidence: [measured]
---

The README is the library's only documentation, and the first thing anyone
reads after the beta is published. It has grown by accretion: every fix added
its edge case where it was made, so it now reads as a log of decisions rather
than a guide to using the library.

Measured on 2026-10-06: 1303 lines, about 8,000 words, 13 sections and 32
subsections, 78 code blocks, 18 browser-specific asides. "Hooks" is 312 lines
and "Components" 296, while "Basic usage" is 35. A newcomer has to read past
clamp ranges, Firefox event orders and snap-back rules to find out how to put a
player on a page.

## Goal

A README a developer can use in three passes: decide whether the library fits
(a minute), build a working player (five minutes), and look up one part or hook
when they need it.

## Rules for the rewrite

- **One fact, one home.** The README says what to do. Why a behaviour exists
  goes in the JSDoc, which the editor shows at the point of use. How it was
  measured goes in `issues/`. Each section is checked against both before
  anything is cut, so nothing is lost, only moved.
- **Lead with tasks, not parts.** Install, a first player, then recipes: a
  playlist, a live stream, chapters, styling, labels, keyboard. The full parts
  list and hook reference come after, short and table-shaped.
- **Edge cases only where a reader would trip.** A browser quirk stays in the
  README only if it changes what the reader writes; otherwise it goes to the
  JSDoc or the ticket.
- **Link the demo** for anything an example already shows, rather than a code
  block that repeats it.
- **No size target, but a smell test:** if a section needs scrolling to find
  its first code block, it is too long.

## Where the detail goes

Split by kind, not by part:

| Kind                                                                                          | Home                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| What one part or prop does: units, ranges, defaults, its quirks                               | JSDoc: shown on hover, shipped in the `.d.ts`, next to the code                                                                           |
| How to do something: styling, localisation, playlists, live streams, chapters, keyboard, refs | `docs/` task guides (`docs/styling.md`, `docs/recipes/live-stream.md`, …), linked from the README; a docs site (D8) can render them later |
| Why it behaves so: measurements, browser history, decisions                                   | `issues/`                                                                                                                                 |
| What it looks like working                                                                    | the examples and the demo, linked                                                                                                         |

The README keeps what the library is, install, a first player, a short map of
the parts and hooks, and links to the guides. npm shows only the README, so
that much has to stand alone; the guides are links to GitHub from there.

No hand-written page per part: readers arrive with a task, not a part name,
and a page per part would repeat the JSDoc and drift from it. A per-part
reference, if wanted, is generated from the JSDoc (TypeDoc or similar), which
D8 already names as a separate decision.

## Done when

- A reader gets from the top of the README to a working, styled player without
  leaving the "Getting started" path.
- Every part and hook still has an entry, linked from a table of contents.
- No behaviour the current README documents is lost: each removed passage is in
  the JSDoc, an example, or a ticket, and the PR says which.
- `pnpm format:check` and the README's internal links pass.
