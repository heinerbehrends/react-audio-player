---
id: F17
title: "A text track hook, for a transcript from a `<track>` child"
epic: features
status: resolved
severity: P3
origin: backlog
breaking: false
---

Found closing finding 3 of the pre-beta review (2026-10-13). The recipe said a
`<track>` child adds captions. On an `<audio>` element the browser fetches
and parses the WebVTT file onto `textTracks` and fires `cuechange`, but draws
nothing, and nothing in the library reaches any of it. A consumer with a VTT
transcript, which is what podcast hosts hand out, has to go through
`audioRef` and the DOM: set the track's `mode`, wait for the `<track>`
element's `load`, listen for `cuechange`.

## Decided

- **A transcript, not captions.** Audio has no picture to overlay, and WCAG
  asks for a transcript for prerecorded audio (1.2.1), captions for video.
  The whole text on the page, the active sentence marked, a click that seeks.
- **One opt-in hook, `useTextTrack()`**, returning plain cues, the active
  index and a load status. No rendering. A separate import with its own
  budget row; the core pays nothing, since it needs only `store.element` and
  `seek`.
- **The JSON route stays the default and needs no hook**: a sorted list,
  `useCurrentSecond()` and `seek()`, as the podcast chapters do (D6). It is
  server-renderable, which a `<track>` is not.
- **After the beta**, as the roadmap already says. The wording fix in the
  recipe and the README is before it.

The plan, with the shape, the mechanics, the tests and the phases, is
`plans/PLAN-text-track.md`.

## Done when

See the plan's "Done when": the hook exported and documented, its jsdom tests
and a fake `TextTrack`, a budget row, the transcript recipe, and the podcast
example showing a transcript on the demo page with an E2E test.

## Resolution (2026-10-13)

All four phases of the plan shipped:

- `useTextTrack()` with `Cue`, `TextTrackState` and `TextTrackOptions`,
  exported opt-in. `Cue` has an `id`, the cue's identifier, which the
  example uses to mark paragraphs. With two cues active the one that began
  last wins: Chromium keeps a cue active at its exact end, so the outgoing
  sentence and the next are both active at every boundary.
- The transcript recipe, the README guide and hooks rows, the captions
  roadmap line gone, and the `<track>` sentence in the `<audio>` recipe.
- The podcast example reads `public/audio/alice-podcast.vtt` through a
  `<track>` and shows it as paragraphs of sentence buttons, with the one
  playing marked and a "Follow along" toggle, off by default. The VTT is
  built by `scripts/build-transcript.mjs`: the Gutenberg text, timed against
  speech recognition of each chapter's excerpt.
- 739 B gzipped, above the plan's estimate; "AudioPlayer only" unchanged.

**Verified by** — `testJSDom/TextTrack/useTextTrack.test.tsx`, 18 cases over a
fake `TextTrack` (`testJSDom/store/textTrackFake.ts`). The E2E test "a
sentence in the transcript seeks there, and is marked while it plays" in
`testE2E/demo/examples.spec.ts`, which found the active-cue rule. `pnpm
size` has the row "AudioPlayer + useTextTrack".
