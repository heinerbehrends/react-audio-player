---
id: B8
title: "Codec fallback via `<source>`"
epic: features
status: rejected
severity: none
origin: backlog
breaking: false
---

Support several encodings of one track (`.opus` with an `.mp3` fallback), which
is what `<audio>` with multiple `<source>` children is for.

**Shape.** A list at the _source_ level, not the track level — this is not the
`audioFiles` playlist array that was removed, which was a collection of
different tracks:

```ts
export type AudioSource = { src: string; type?: string };
export type AudioFile = AudioSource | { sources: AudioSource[] };
```

**Why it is deferred, and it is not the type.** `<source>` children change the
reload contract the store is built on.

Today, changing `audioFile.src` updates the `src` **attribute**, the browser
re-runs resource selection unprompted, and fires `emptied` → `loadstart` — the
two rows at `src/store/syncFromElement.ts:151-152` that call `prime()` and
re-read every atom. **The whole track-swap story, including the shipped
`onEnded` playlist, rides on that automatic cycle.**

`<source>` children do not participate. Per the HTML resource selection
algorithm, mutating them after it has run has no effect until `el.load()` is
called explicitly. So in sources mode a playlist advance would render new DOM
and **silently keep playing the old track** — no error, no event.

**What implementing it requires:**

- An effect calling `el.load()` when the source list changes, **keyed on
  serialised content, not identity** — the documented usage passes an inline
  literal, so an identity-keyed effect is a reload loop. (Same hazard already
  documented on `PlayerConfigProvider`.)
- Reworking the error path: with `src` a failure is one `error` on the element;
  with `<source>` each child errors and the element only fails once all have,
  with different `MediaError` timing. `testE2E/Player/error-recovery.spec.ts`
  and the `loadState` machine both assume the `src` path.
- **E2E-only coverage.** jsdom has no resource selection whatsoever, so none of
  this is testable in the unit tier. Needs real multi-format fixtures —
  `public/` currently holds one `.mp3`.
- Documenting that `<source>` must precede `<track>` in the children order.

**Verdict:** worth doing, and the type shape is right, but it is a second
resource-loading mode with its own reload and error semantics touching the most
load-bearing part of the store. It gets its own change and its own tests, not a
fold-in. Note that `audioFile` would have to become omittable in sources mode,
since a present `src` attribute makes the browser ignore `<source>` children
entirely.

## Beta assessment (2026-10-01)

**Not blocking.** The frontmatter says breaking, but widening `AudioFile` to
`AudioSource | { sources: AudioSource[] }` is additive for every consumer
passing `{ src }`, and that is all of them today. Confirm the shape before the
beta so the README can promise it; implement after. Tracked from **G0**.

**Shape confirmed** (2026-10-01): `AudioFile = AudioSource | { sources: AudioSource[] }`.
The README promises it under `<AudioPlayer>` and on the roadmap. Implementation
stays open, with everything above still true.

## Decision (2026-10-08): rejected

**Not worth the bytes.** The confirmed shape above also dropped `title`,
`artist`, `album`, `artwork` and `live`; corrected, it is
`TrackInfo & ({ src } | { sources })`. Two gaps the ticket did not list:

- `AudioElement` calls `continuePlayback()` when `src` changes. In sources mode
  `src` is always `undefined`, so a playlist advance would stop playback.
- When every `<source>` fails, the element sets `networkState` to
  `NETWORK_NO_SOURCE`, leaves `error` null and fires nothing on itself. The
  store's `isUnusable` returns early on a null `error`, so the player would
  stay `"loading"` forever.

Estimated, not measured: ~150–250 B gzip in core, or ~20–40 B in core plus an
opt-in `<AudioSources>` part. `AudioPlayer only` had 24 B of headroom
(2576 / 2600 B).

Multiple sources were for the years when no single format played everywhere.
Every current browser plays MP3 and AAC, and podcasts ship one file per episode
because an RSS enclosure is one URL. What is left is a bandwidth saving (Opus
first, MP3 fallback), and the consumer gets it with `canPlayType` before
passing `src`, at no cost to the library and with track swaps, errors and
`onEnded` unchanged. That loses only the step to the next file on a 404, which
for self-hosted files is a server bug. The recipe replaces the "planned"
section in `docs/recipes/audio-element.md`, and the roadmap line is gone from
the README. `AudioFile` stays as it is.

If demand turns up after the beta, the opt-in part is the design, and widening
`AudioFile` then breaks only code that reads `.src` off one.
