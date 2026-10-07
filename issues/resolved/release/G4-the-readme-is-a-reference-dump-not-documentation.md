---
id: G4
title: "The README is a reference dump, not documentation"
epic: release
status: resolved
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
- **An example over README code.** A runnable example beats a code block: it is
  type-checked, tested in CI, shown on the demo page and opens in a sandbox.
  Where a README block shows a whole feature rather than one line, it becomes
  an example, or moves into an existing one, and the README links to it. Short
  snippets that show one prop stay. The candidates are listed in
  `plans/PLAN-demo-site.md`, "Examples from the README rewrite".
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

## Resolution

**Shipped** (2026-10-06) — the README goes from 1303 lines to 320: what the
library is, install with the ESM-only and React requirements, a "Getting
started" that ends in a working, styled player, a guide table, and short
reference tables for `<AudioPlayer>`'s props, every part, every hook, every
props hook and the default shortcuts. Links from the README are absolute
GitHub URLs, so they work on npm. The detail moved into twelve task guides
under `docs/`, which link to each other relatively.

**Where each removed passage went:**

| README section (before)                                                       | Now                                                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro: no `asChild`                                                           | `docs/your-own-buttons.md`; reasoning in D1 and D9                                                                                           |
| Features, Basic usage                                                         | README, rewritten as "A first player" with `PlayerRoot`, `Time` and `MuteButton`                                                             |
| Accessibility (all of it)                                                     | `docs/accessibility.md`, with a "what is yours to do" list on top; the WCAG 2.5.3 reference is in A17 and `TimeDisplay.tsx`                  |
| Localisation (all subsections)                                                | `docs/localisation.md`; the RSC and `de.json` reasoning kept to one sentence, the rest in A15 and S3                                         |
| Components: `<AudioPlayer>` props, `AudioFile`                                | README props table; `AudioFile` fields in its JSDoc                                                                                          |
| Reaching the `<audio>` element, `<source>` fallback                           | `docs/recipes/audio-element.md`                                                                                                              |
| Playlists                                                                     | `docs/recipes/playlist.md` and the playlist example; carry-on history in F13, F14, B1                                                        |
| Timeline, `<TimelineBuffered>`                                                | README parts table; buffered detail in `docs/recipes/chapters.md`; `.Control` required in its JSDoc; the `NODE_ENV` branch in S14            |
| Playback controls, Volume, Time display, Rate, Rate slider, Errors            | README parts table; per-part contracts in the JSDoc; iOS volume in `docs/custom-ui.md` and D3; the rate clamp's Firefox reasoning in C14, G2 |
| `<MediaSession>`                                                              | `docs/recipes/lock-screen.md`                                                                                                                |
| Styling, state attributes, stylesheet, inline styles, custom properties       | `docs/styling.md`, plus the minimal CSS in "Getting started"                                                                                 |
| Props hooks                                                                   | `docs/your-own-buttons.md`; README table                                                                                                     |
| `useAudioPlayer()`, position hooks, `useIsSeekable()`, buffering, end, volume | `docs/custom-ui.md`; README hooks table; Chrome's 0.5 s overshoot in `derived.ts`, the detached-element probe in `volumeAvailable.ts`        |
| `useAudioError()`                                                             | `docs/recipes/errors.md`; the no-output-device `MEDIA_ERR_DECODE` story in B12 and `syncFromElement.ts`                                      |
| `useIsLive()`, Live streams in Firefox, Requirements' live paragraph          | `docs/recipes/live-stream.md` and the live example; browser versions in B11, the Radio Mast resume in D11                                    |
| Floored `useCurrentSecond()` comparison                                       | `docs/recipes/chapters.md` and the podcast example                                                                                           |
| Keyboard shortcuts                                                            | README table; `docs/keyboard.md`, which adds a rebinding example                                                                             |
| Roadmap, Testing, Requirements, License                                       | README                                                                                                                                       |

`docs/styling.md`'s selector table gains the `<PlayerRoot>` row
(`data-part="player"`), which the old table left out.

A second pass (2026-10-07) moved the last browser aside, Firefox's `ended` on
a paused seek (B4), out of the `onEnded` table cell into its JSDoc and
`docs/recipes/playlist.md`; dropped the rate-clamp paragraph, which the parts
table and `setRate`'s JSDoc already carried; and put the shared slider parts
directly under `<Timeline>`.

**Not done here:** the four new examples in `plans/PLAN-demo-site.md`
(design-system, localised, keyboard, hls). Until they land, those guides carry
their code blocks and the README's guide table leaves their example cell
empty.

**Verified by** — the "Getting started" component and CSS, extracted verbatim
from the README, rendered in Chromium against `src/`: a styled row, a click on
the middle of the timeline seeks to 141 of 283 s, and the region is named by
`audioFile.title`. A link check over README.md and `docs/**` (relative paths,
GitHub URLs mapped to local files, and `#` anchors against headings) finds no
broken link; `pnpm format:check` clean.
