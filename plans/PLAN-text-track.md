# Plan: a text track hook (F17)

A `<track>` child under `<audio>` is the browser's own way to carry timed text:
it fetches the WebVTT file, parses it into a `TextTrack`, and fires `cuechange`
as the playhead crosses cue boundaries. On an audio element it draws nothing,
and nothing in the library reaches it: a consumer who wants a transcript from a
VTT file has to go through `audioRef` and the DOM. This plan adds one hook
that makes the track React data, and uses it to give the podcast example a
transcript. It settles the shape first, then lands in four phases.

## Status: done 2026-10-13.

Changed while building:

- **`Cue` has an `id`**, the cue's identifier in the file. It marks
  paragraph starts, one cue per sentence, which is how phase 4 will keep the
  prose's shape.
- **The text comes from `getCueAsHTML().textContent`**, the browser's own
  parse, rather than a regex and an entity table: shorter, and right for
  every entity.
- **A track from `addTextTrack()`** is `"ready"` at once: it has no `<track>`
  element to report on, and `addCue` fires nothing.
- **Measured 739 B gzipped**, above the 400–600 B estimate. The row
  "AudioPlayer + useTextTrack" is 4300 B, the file's usual 15 %; "AudioPlayer
  only" did not move.
- **The cue that began last wins, not the first.** Chromium keeps a cue
  active at its exact end, so at each sentence boundary of the transcript the
  outgoing and incoming sentences are both active, and "first wins" marked
  the one already finished. Found by the E2E test.
- **The transcript's timings came from an online speech-recognition tool**,
  run on each chapter's excerpt, and its text from the Gutenberg book.
  `scripts/build-transcript.mjs` aligns the two word by word, drops two
  recognition faults, and writes one cue per sentence with paragraph ids.
- **The sentences are buttons**, not spans with a click handler, so the
  transcript seeks from the keyboard too. A sentence clicked before the
  duration is known waits for it, as a chapter does.

---

## What it is for

A transcript, not captions. Audio has no picture to overlay, and a listener who
wants the words wants all of them: readable at reading speed, searchable,
with a tap on a sentence to hear it and a marker that follows the voice. That
is the whole transcript on the page with the active sentence tinted, as Apple
Podcasts and Spotify do it. WCAG agrees on the medium: prerecorded audio-only
needs a transcript (1.2.1), and captions are the requirement for video.

The same hook renders a caption line, since that is the active cue alone, and
reads a `<track kind="chapters">`, since chapters are a transcript with twelve
cues. Neither is the goal; both come free.

## What exists already, and stays the default

A transcript a consumer holds as JSON needs no hook: a sorted list,
`useCurrentSecond()` and `seek()`, which is the podcast example's chapter list
with more entries (D6). That route is server-renderable, so the text is in the
HTML for search engines and for anyone who never presses play, and it needs no
second request and no CORS header on the audio host. The recipe shows it
first. The hook is for the consumer whose transcript is a VTT file, which is
what podcast hosts hand out.

## The shape

```ts
type Cue = {
  /** Where the cue starts, in seconds. */
  start: number;
  /** Where it ends, in seconds. */
  end: number;
  /** The cue's text, with VTT markup stripped. */
  text: string;
};

type TextTrackState = {
  /** Every cue, in order, as plain objects; empty until the track has loaded. */
  cues: readonly Cue[];
  /** The index in `cues` of the cue playing now, or `-1` between cues. */
  activeIndex: number;
  /** `"none"` without a matching `<track>`, then `"loading"`, `"ready"` or `"error"`. */
  status: "none" | "loading" | "ready" | "error";
};

function useTextTrack(options?: {
  /** Which kind to read. Defaults to subtitles or captions, whichever is present. */
  kind?: TextTrackKind;
  /** The `srclang` to prefer when several tracks match. */
  language?: string;
}): TextTrackState;
```

Decisions behind it, each the plain one:

- **`useTextTrack`, not `useTranscript`.** It names the browser object it
  reads, and it serves chapters and captions as well. The recipe is called
  "Transcript", which is where the use case lives.
- **Plain cue objects, not `VTTCue`s.** Stable between renders, safe to map
  over, and serialisable. The raw `TextTrack` stays reachable through
  `audioRef` for anyone who needs positioning or the `cue.getCueAsHTML()`.
- **`activeIndex`, not `activeCues`.** A transcript marks one entry and a
  caption line shows one cue; with overlapping cues the one that began last
  wins. The index
  is what a list needs; the cue is `cues[activeIndex]`.
- **One track per call.** Several languages are several `<track>` children;
  the consumer picks with `language`, or calls the hook twice.
- **No rendering, scrolling or search.** Layout is the consumer's. The recipe
  shows prose with a tinted sentence, and says auto-scroll is a toggle the
  reader controls, never the default, because it fights someone reading ahead.
- **No JSON input.** That route needs no hook; see above. A `cues` option can
  come later if anyone asks.
- **An opt-in export like `<MediaSession>`.** A separate import, in the
  bundle script's opt-in list, with its own budget row. The core pays nothing:
  the hook needs only `store.element`, which `<TimelineBuffered>` already
  reads, and `seek`, which is a control.

Usage, for the transcript:

```jsx
function Transcript() {
  const { cues, activeIndex, status } = useTextTrack();
  const { seek } = useAudioControls();
  if (status !== "ready") return null;
  return (
    <p className="transcript">
      {cues.map((cue, i) => (
        <span
          key={cue.start}
          data-active={i === activeIndex || undefined}
          onClick={() => seek(cue.start)}
        >
          {cue.text}{" "}
        </span>
      ))}
    </p>
  );
}
```

## How it works

1. **Find the track.** From `store.element`, read `element.textTracks`, filter
   by `kind` (default: `"subtitles"`, else `"captions"`), then by `language` if
   given, else prefer the one whose `<track>` has `default`, else the first.
   The `<track>` element behind a `TextTrack` is the child whose `.track` is
   that object; it is needed for the load state.
2. **Make the browser load it.** A `<track>` without `default` sits in mode
   `"disabled"` and never fetches. Set `"hidden"` when it is `"disabled"`;
   leave `"showing"` alone. On `<audio>` the two are the same on screen.
3. **Wait for the cues.** `track.cues` is `null` until the `<track>` element
   fires `load`; `error` means a missing or unparseable file. `status` follows
   the element's `readyState`: `NONE` or `LOADING` is `"loading"`, `LOADED` is
   `"ready"`, `ERROR` is `"error"`. No matching track is `"none"`.
4. **Follow the playhead.** `cuechange` on the `TextTrack` fires at every cue
   boundary. Read the last of `activeCues`, find its index in `cues` by walking the
   `TextTrackCueList` once, and publish. Nothing polls `currentTime`, and the
   hook re-renders once per sentence rather than once per second.
5. **Hand React a snapshot.** `useSyncExternalStore` with a subscribe that
   attaches `addtrack`, `removetrack` and `change` on `textTracks`, `load` and
   `error` on the `<track>` element, and `cuechange` on the track; the snapshot
   is one cached object replaced only when something changed, so a render
   with nothing new bails out. The server snapshot is a constant
   `{ cues: [], activeIndex: -1, status: "none" }`, which is also what the
   first client render sees, so there is no hydration mismatch and the recipe
   says the transcript appears after load.
6. **Follow the element.** The element arrives through `store.element` after
   mount and is the same `<audio>` across track swaps, so a consumer who
   changes the `<track src>` with the episode gets a fresh `load`, and the
   snapshot follows. Detach everything when the element atom goes `null`.

Support: `textTracks` on `<audio>`, `cuechange` and the `<track>` `load` event
work in Chromium, Firefox and Safari. A VTT file on another origin needs
`crossOrigin` on the element; the recipe says so.

## Phases

### 1. The hook and its tests

- `src/TextTrack/useTextTrack.ts`: the hook above, with `Cue` and
  `TextTrackState`. JSDoc on every member and option, to the measured
  density (one sentence a member, one to three for the hook).
- `testJSDom/store/textTrackFake.ts`: jsdom has no `TextTrack`, so a fake
  `TextTrackList` with `addEventListener` and `emit`, fake tracks with
  `kind`, `language`, `mode`, `cues`, `activeCues` and `cuechange`, and fake
  `<track>` elements with `readyState`, `track`, `default`, `load` and
  `error`. Hung off `MediaElementFake` as `textTracks` and `querySelectorAll`.
- `testJSDom/TextTrack/useTextTrack.test.tsx`: picks the default track, the
  first of a kind, and one by language; sets a disabled track hidden and
  leaves a showing one alone; `status` goes loading, ready, and error; cues
  come out as plain objects in order; `activeIndex` follows `cuechange` and
  is `-1` between cues; the snapshot keeps its identity when nothing changed;
  a track that loads after the hook mounted is picked up; the element
  attaching after mount is picked up; every listener is gone after unmount;
  the server snapshot is the empty one.

### 2. Export and budget

- `src/index.ts`: `useTextTrack` and the two types, exported individually
  with a comment naming it opt-in, as `<MediaSession>` is.
- `scripts/bundle-size.mjs`: add it to `OPT_IN` and a row "AudioPlayer +
  useTextTrack", budget set from the measurement plus the usual headroom.
  Expect 400 to 600 B gzipped; "AudioPlayer only" must not move.
- `pnpm check-docs` and `pnpm doc-stats` on the new `.d.ts` members.

### 3. Docs

- `docs/recipes/transcript.md`: the JSON route first, as prose with a tinted
  sentence and a click that seeks; then the VTT route with the hook; the
  auto-scroll note; the server-rendering difference; `crossOrigin` for a
  cross-origin file; a caption line as the one-cue case.
- `docs/recipes/audio-element.md`: the `<track>` sentence says what a child
  does on `<audio>` and points at the recipe.
- README: the guide row "Add captions, Web Audio or HLS" becomes two rows, one
  for the transcript with the podcast example; the roadmap line "Caption and
  subtitle support" goes.
- CHANGELOG entry under the release it ships in.

### 4. The podcast example

- A timed transcript of the three chapters as `audio/alice-podcast.vtt`,
  produced offline from the LibriVox recording and corrected against the
  Gutenberg text, which is public domain. Paragraph breaks as blank lines in
  the file so the prose keeps its shape.
- `<track kind="subtitles" srcLang="en" default>` through `audioProps`, and a
  `Transcript` component as in the recipe, rendered as paragraphs below the
  chapter list, with a "Follow along" toggle for auto-scroll, off by default.
- `testE2E/demo/examples.spec.ts`: a sentence is marked while it plays, and a
  click on a sentence seeks there.
- Whether the chapter list then reads a `<track kind="chapters">` through the
  same hook is a separate, later choice; the JSON list stays for now.

## Done when

- `useTextTrack()` is exported with the shape above, documented to the
  measured density, and `pnpm check-docs` passes.
- The jsdom tests in phase 1 pass, and the whole suite with them.
- `pnpm size` passes with the new row, and "AudioPlayer only" is unchanged.
- The transcript recipe exists, the README no longer promises captions, and
  the podcast example shows a transcript on the demo page with its E2E test.
- F17 is resolved with what shipped and what verifies it.
