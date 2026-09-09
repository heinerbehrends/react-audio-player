---
id: B8
title: "Codec fallback via `<source>`"
epic: features
status: open
severity: none
origin: backlog
breaking: true
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
