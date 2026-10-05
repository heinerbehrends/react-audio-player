# Plan: demo site and examples (D8)

**D8** names the adoption gap: no docs site, no deployed demo, no sandbox link.
For a headless library there is nothing to look at except what a consumer builds,
so the examples are the product page. This plan settles where the examples live
and how one copy of each serves the demo page, the sandboxes and CI, then lands
them in five phases.

## Status: phase 1 built 2026-10-05, deploying to GitHub Pages.

---

## The one structural decision: examples in the repo, sandboxes open them

**Each example is a standalone Vite project under `examples/`. The demo page
renders all of them from source, and every "Open in StackBlitz" link opens the
same folder straight from GitHub.** The repo is public, so StackBlitz's GitHub
import works (`stackblitz.com/github/heinerbehrends/react-audio-player/tree/main/examples/<name>`).

| option                         | first impression       | editable | drifts from the code       |
| ------------------------------ | ---------------------- | -------- | -------------------------- |
| demo page in the repo only     | instant, styled        | no       | no — builds against `src/` |
| sandboxes only                 | several seconds' boot  | yes      | yes — outside CI           |
| **examples here, both on top** | instant, then editable | yes      | no                         |

A sandbox made in the StackBlitz UI is outside review and CI, and pins a version
that goes stale with every beta. A folder in the repo is neither.

**The dev app stays what it is.** `src/App.tsx` is the E2E fixture: generated
test tones, a `players` query parameter, `<Debug>`. A showcase pulls it in the
opposite direction. The demo gets its own entry point and its own deploy.

## Layout

```text
examples/
  minimal/      package.json · index.html · vite.config.ts · src/{main,App}.tsx · src/App.css · src/audio.ts
  playlist/
  podcast/
  waveform/     … plus src/peaks.json
demo/
  index.html · vite.config.ts · src/main.tsx · src/Demo.tsx
```

- **An example is a project StackBlitz can run as is.** Its `package.json`
  depends on `react`, `react-dom` and `react-headless-audio-player@beta`; its
  imports use the package name, never a relative path into `src/`. No example
  imports from another: duplication between them is the price of each standing
  alone.
- **The demo aliases the package to the source.** `demo/vite.config.ts` maps
  `react-headless-audio-player` to `../src/index.ts` and
  `react-headless-audio-player/styles.css` to `../src/styles.css`, and sets
  `resolve.dedupe: ["react", "react-dom"]` so an `examples/*/node_modules` left
  by someone running `npm install` there cannot load a second React.
- **The demo imports each example's `App`** and shows its source next to it
  through Vite's `?raw` import, so the code on screen is the code that runs.
- **Examples are not workspace packages** and are never installed locally. The
  repo's own `node_modules` resolves `react` for them during the demo build.
- **Type-check and lint cover `examples/` and `demo/`** through a
  `tsconfig.demo.json` with a `paths` entry for the package name, added to the
  `type-check` script.
- **Examples carry no `tsconfig.json`.** An editor in this repo resolves an
  example by the nearest one, which would have no `paths` and could not find
  the package; without one it reaches `tsconfig.demo.json` through the root's
  references. Vite needs none to run, and `@vitejs/plugin-react` in each
  example's `vite.config.ts` handles JSX.
- **Each example's CSS is scoped to its own root class** (`.minimal`, …): on
  the demo page every example shares one document. `styles.css` is global
  there too, so the custom examples reset what they rely on rather than assume
  its absence.

## The examples

| example      | shows                                                                                                                                                       | styling                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **minimal**  | A compact dark bar after a news-site podcast player: play, timeline, time, volume. The "it is this small" pitch                                             | `styles.css` + a few lines |
| **playlist** | A track list in consumer state, `onEnded` advance with the resume effect from the README, `<MediaSession>` with previous/next — the lock screen is the demo | custom                     |
| **podcast**  | Rate options, ±15/30 s `<SeekButton>`s, chapters as a userland list that seeks and highlights the current one, `<MediaSession>` with artwork                | custom                     |
| **waveform** | Precomputed peaks as SVG bars inside `<Timeline>`, the played part highlighted, the bar beneath. D5 with no library change                                  | custom                     |

Minimal is the one on `styles.css`: it shows what the optional stylesheet
gives, and the three custom ones show the parts take any markup.

**Chapters stay userland in the podcast example** — a sorted list,
`useCurrentSecond()` and `seek()`. That is possible today, and building it is
the best evidence for which parts of **D6** earn a place in the library.

**Live radio is not in this plan.** It wants **D4**'s `isLive` signal to read
cleanly, and a third-party stream URL that will still answer in six months. A
dead stream is a worse demo than none. A fifth example once both exist.

## The waveform, verified

Spiked on 2026-10-05 in a throwaway page against `src/`, Chromium, and deleted:

```jsx
<Timeline style={{ height: 80 }}>
  <Waveform peaks={peaks} /> {/* gridArea "1 / 1", pointerEvents "none" */}
  <Timeline.Background style={{ alignSelf: "end", height: 4 }} />
  <Timeline.Progress style={{ alignSelf: "end", height: 4 }} />
  <Timeline.Control style={{ background: "transparent" }} />
  <Timeline.Thumb style={{ bottom: -4 }} />
</Timeline>
```

- The root is a one-cell grid and `.Control` fills it, so a click anywhere on
  the waveform seeks: a click 10 px from the top at 60 % of the width landed on
  `.Control` and seeked to 0.600 of the duration.
- `ArrowRight` still steps 5 s, `role="slider"` and `aria-valuetext`
  ("Position 2:54 of 4:43") are intact, and the focus ring wraps the whole
  waveform.
- The played part is a second copy of the bars clipped with
  `clip-path: inset(0 ${(1 - played) * 100}% 0 0)`, `played` from
  `useCurrentTime() / duration`, with the same `250ms linear` transition as
  `.Progress`. Its edge lines up with the thumb.
- `.Progress` cannot do the clipping: it scales with `scaleX`, which squashes
  bars instead of cutting them. The userland clip re-renders the waveform about
  four times a second. A `--progress` custom property on the root (**S20**)
  would make it CSS alone — optional, not a prerequisite.

**Peaks are precomputed, not decoded at runtime.** A runtime decode fetches the
whole file twice and adds Web Audio code that is not the point of the example.
`scripts/generate-peaks.mjs` decodes the track once in headless Chromium through
Playwright, already a dev dependency (no ffmpeg on the dev machine, and none
needed), and writes `examples/waveform/src/peaks.json`: a few hundred numbers,
normalised to 0–1.

wavesurfer.js on `audioRef` with `interact: false` is the same idea for people
who already use it. It belongs in the README as a recipe, not in an example
that should install nothing but React and the library.

## Audio

- **`The-Race.mp3`** (6.8 MB, 4:43, free to distribute) for minimal and
  waveform.
- **LibriVox's _Alice's Adventures in Wonderland (version 2)_**, read by Kara
  Shallenberg, for playlist and podcast.
  [librivox.org/alices-adventures-in-wonderland-by-lewis-carroll-4](https://librivox.org/alices-adventures-in-wonderland-by-lewis-carroll-4/),
  catalogued 2010-03-18: "LibriVox recordings are Public Domain in the USA."
  Twelve chapters, one reader, 64 kbps CBR at 22.05 kHz throughout, 10–16
  minutes each, with the chapter titles in the ID3v2 tags. The source, reader
  and statement go in a `CREDITS.md` next to the files.
  - **Playlist:** chapters 1–3 as separate tracks (Down the Rabbit-Hole, The
    Pool of Tears, A Caucus-Race and a Long Tale; 36:44, 17.7 MB).
  - **Podcast:** chapters 10–12 joined into one file (The Lobster Quadrille,
    Who Stole the Tarts?, Alice's Evidence; 39:25, 18.9 MB), with chapter
    marks at 0, 13:50.7 and 26:03.6.
  - **Artwork:** LibriVox's cover, 300 × 300 JPEG, from
    `archive.org/download/LibrivoxCdCoverArt/Alices_Adventures_in_Wonderland_1003.jpg`.
    The book page states no licence for the cover itself; confirm before
    publishing it. Small for a lock screen, which prefers 512 px, but the OS
    scales it.
- **Joining needs no ffmpeg, but needs the `Info` frame removed.** Strip each
  file's ID3v2 header, ID3v1 trailer and first frame — a LAME `Info` header
  holding that chapter's own frame count — then concatenate. Left in, Firefox
  takes the duration from the first header: on a test join of two chapters it
  reported 619.8 s of 1392.3 s and sent a seek past the seam to 0. Stripped,
  the 10–12 join reads 2364.8 s in Chromium and Firefox, and seeks land on
  both sides of each seam and near the end (2026-10-05). With CBR, chapter
  starts are byte offsets ÷ 8000. Safari is unchecked: WebKit is not installed
  here, so that is a manual check on a device. The join becomes
  `scripts/join-chapters.mjs`, emitting the chapter times alongside the file.
- **Served once, from the deployed demo.** The demo's `publicDir` is the repo's
  `public/`, which the dev app and the E2E suite already read
  `The-Race.mp3` from, so there is no second copy. Each example's
  `src/audio.ts` reads `import.meta.env.VITE_AUDIO_BASE`, which the demo
  defines as its own base path, and falls back to the deployed site's URL —
  which is what a sandbox gets. Copies in `examples/*/public/` would bloat the
  repo, and a StackBlitz sandbox imports the whole folder. An `<audio>`
  element plays a cross-origin file without CORS, and the peaks are
  precomputed, so nothing reads the bytes from script. The fallback URL in each
  `audio.ts` is fixed once the host is chosen.

## Hosting

**GitHub Pages**, chosen 2026-10-05 over Netlify: no new vendor or secret. The
site is `https://heinerbehrends.github.io/react-audio-player/`, which is also
the fallback audio base in each example's `audio.ts`.

`.github/workflows/demo.yml` builds with `DEMO_BASE=/react-audio-player/` —
`base` comes from that variable, default `/` — and deploys `demo/dist` with
`actions/upload-pages-artifact` and `actions/deploy-pages`. Its own workflow
rather than a job in `test.yml`, so a red test run does not take the site down;
it runs on pushes to `main` that touch what the build reads. The sub-path build
is verified locally: page and track both load. Pages has to be set to "GitHub
Actions" as its source in the repository settings, once.

Netlify's preview deploy per pull request was the case for it. The build is
host-agnostic, so moving later is a `netlify.toml` and a changed fallback URL.

## Phases

Each phase is one commit with its checks, in this order.

### Phase 1 — scaffold, minimal, deploy

- `demo/` with the aliasing config, a page shell and one example slot;
  `examples/minimal/` complete.
- `tsconfig.demo.json`, wired into `type-check` and ESLint.
- `.github/workflows/demo.yml`, deploying to GitHub Pages.
- E2E: a `demo` Playwright project, Chromium only, against the demo's dev
  server on 5175 (5173 is the dev app); the two existing projects ignore
  `testE2E/demo/`. One test per example — the track loads and the timeline
  advances after play. Not the library's behaviour, which the existing suite
  covers: only that the example still runs.
- Found on the way: a class could not size the `<Timeline>` root, which kept an
  inline `height: 100%` the other roots dropped in S8. **S25**, fixed the same
  day. Also: a root's inline `display: grid` outranks a class that hides it, so
  the minimal example hides its volume slider through a wrapper.

### Phase 2 — playlist

- Tracks in state, the README's resume-on-advance effect, `<MediaSession>` with
  `onPreviousTrack` / `onNextTrack`, a clickable track list with the current one
  marked.
- E2E: next advances and the session title follows.

### Phase 3 — waveform

- `scripts/generate-peaks.mjs` and the committed `peaks.json`.
- The example as spiked above, styled.
- E2E: a click on the waveform's upper half seeks.

### Phase 4 — podcast

- `scripts/join-chapters.mjs` and the joined chapters 10–12. Rate options, the
  two skip sizes, the userland chapter list, `<MediaSession>` with artwork.
- E2E: a chapter click seeks, and the current chapter follows playback.

### Phase 5 — sandboxes and links

- After `0.1.0-beta.0` is on npm: until then `react-headless-audio-player@beta`
  does not resolve and every sandbox fails to install.
- "Open in StackBlitz" on each example; the README links the demo from the top
  and from each component section the examples cover.
- Resolve **D8**.

The order of publishing is: demo live, beta published, sandbox links, then the
announcement. Phases 1–4 need nothing from npm.

## Not in this plan

- **A documentation site.** The README stays the reference; the demo is the
  showcase. A generated API site is a separate decision.
- **Live radio and HLS.** Above; HLS is **D7**'s README recipe.
- **A mini-player.** Mostly a layout exercise, and the playlist covers the
  library surface it would show. A styling variant of the playlist if wanted.
- **Library changes.** None are required. S20's `--progress` would tidy the
  waveform, and D6 may follow from the podcast example; both are their own
  tickets.

## Estimate

Phase 1 is a day: the aliasing, the Pages workflow and the E2E project are
most of it. Phases 2 and 3 are half a day each. Phase 4 is half a day, the join
script included. Phase 5 is an hour after the publish. About three days in all.
