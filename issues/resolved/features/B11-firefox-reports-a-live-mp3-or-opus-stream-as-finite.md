---
id: B11
title: "Firefox reports a live MP3 or Opus stream as a growing finite track"
epic: features
status: resolved
severity: P1
origin: backlog
breaking: false
evidence: [measured]
---

`useIsLive()` is `duration === Infinity` (D4). Firefox does not report a live
Icecast stream that way for every codec. Probed on 2026-10-06 with Playwright's
Firefox 153 against Radio Mast's reference streams
(<https://www.radiomast.io/reference-streams>), sampling `duration` every 2.5 s
while playing:

| stream                  | Chromium 151 | Firefox 153                         |
| ----------------------- | ------------ | ----------------------------------- |
| MP3 128k stereo         | `Infinity`   | 6.6 → 9.2 → 12.2 → 14.7, 14 changes |
| MP3 32k mono            | —            | 22.9 → 25.8 → 28.0 → 31.3           |
| Ogg Opus 64k            | —            | 13 → 15 → 18 → 21                   |
| AAC-LC 128k / HE-AAC v1 | `Infinity`   | `Infinity`                          |

In Firefox the duration is the length buffered so far, and grows with a
`durationchange` every few hundred milliseconds. So on an MP3 or Opus stream:

- `useIsLive()` is `false`, and `useIsSeekable()` is `true`
- the timeline and `SeekButton` are enabled, against a range that moves
- `Time.Remaining` counts a small, jittering number down to nothing
- `<MediaSession>` reports a finite position to the OS

## Ruled out

Two fixes found online, measured on 2026-10-06 and neither holds:

- **Strip `Accept-Ranges: bytes` on the server.** Radio Mast already sends
  `Accept-Ranges: none`, and Firefox still reports a finite duration. A
  library cannot change a station's headers anyway.
- **`duration > 86400 || currentTime > duration` on `timeupdate`.** Over 20 s
  it fired 0 times in 73 `timeupdate`s on the MP3 stream, and only twice, at
  the start, on Opus. Firefox's duration is the buffered end, which stays
  2.7 s (MP3) to 9.5 s (Opus) ahead of `currentTime`.

## The rising-duration signal, measured

Measured on 2026-10-06, Chromium 151 and Firefox 153, 20 s of playback each,
logging every `durationchange`. The candidate rule: the duration rose at least
3 times while playing, each time within 30 s of `currentTime`.

Fixtures: Radio Mast's live MP3, Opus and AAC; `The-Race.mp3` (CBR with an
`Info` frame); header-less MP3s from `lamejs` (CBR, and VBR built by joining
CBR segments of different bitrates); a `MediaRecorder` recording. Local files
were served throttled and with `Accept-Ranges: none`, with or without
`Content-Length`.

| source                            | Chromium                        | Firefox                     |
| --------------------------------- | ------------------------------- | --------------------------- |
| live MP3 / Opus                   | `Infinity`                      | rule fires at 4.8 s / 5.9 s |
| live AAC                          | `Infinity`                      | `Infinity`                  |
| CBR file, with or without header  | fixed                           | fixed                       |
| header-less VBR file, with length | **rule fires at 26–33 s**       | fixed (one estimate)        |
| any file without `Content-Length` | `Infinity` (live today)         | rule fires at 3.7–7.7 s     |
| `MediaRecorder` blob              | `Infinity` until played through | fixed                       |

- **Firefox live streams** grow at 1.00–1.14× wall-clock from the start, about
  one `durationchange` a second, staying 3–12 s ahead of `currentTime`.
- **Chromium, header-less VBR** is the false positive. The duration holds at
  its first estimate until the demuxer reads past it, then rises with every
  packet (50–70 changes a second). Chromium's own position is wrong on these
  files too (it ran at 0.3–2× real time), so they are already broken there.
- **Firefox, no `Content-Length`**: the rule fires, which matches Chromium's
  `Infinity` for the same response. Not a false positive by the library's own
  definition.
- Firefox stopped with a media error at the 320→32 kbps join in two VBR
  fixtures, so its header-less-VBR row rests on the runs that played through.

A guard that the duration grows at about wall-clock speed (0.7–1.6×) within
the first 10 s of playback separates every case measured. It is tuned to these
fixtures: a header-less VBR file whose expensive frames last only a second
or two could still trip it in Chromium.

### `seekable` adds nothing

The same sources, sampling `seekable` every 500 ms, and the header-less files
again from a server that answers range requests (`206`), as real file hosts do:

- **Live:** Chromium `0–Infinity`; Firefox `0–duration` (MP3, Opus) or no
  range at all (AAC).
- **Files, no range support:** Chromium `0–0`; Firefox `0–` the buffered end.
- **Files, range support:** both `0–duration`, including Chromium's header-less
  VBR files, whose `seekable` end grows with the duration.

"The duration rises and `seekable` ends at it" excluded Chromium's VBR false
positive only when the server refused ranges. With ranges it fired at
19.5–22.7 s, exactly as the duration-only rule did. The firing time still
separates them: Firefox's live streams fired at 4.0–7.7 s.

## Resolution

**Shipped** (2026-10-06) — **`audioFile.live`**. The player cannot tell a
growing Firefox stream from a file, so the consumer says so. `AudioElement`
renders it as `data-live` on the `<audio>`, in the same commit as `src`, so
the new source's `loadstart` already sees it. `projectDuration` and the write
path's `isSeekable` read the attribute off the element, so the store gained no
API. A marked stream projects exactly as `Infinity` does: `duration` reads `0`
and `isLive` is true, so `useIsSeekable()`, the timeline, `SeekButton`, the
time readouts and `<MediaSession>` follow without changes. The seek keys,
`SET_TIME_TO_START` and `SET_TIME_TO_PERCENT` ignore it too.

Cost: 53 B gzipped on "AudioPlayer only" (2547 → 2600 B). A first version that
passed the flag through a store setter, a layout effect and every sync handler
cost 133 B. The trade: toggling `live` on an unchanged `src` takes effect at
the next `durationchange`, not at once.

**Designed, built and not shipped: detection.** An opt-in `<LiveDetection>`
(~250 B gzipped) implemented the rule above: live when, within the first 10 s of
uninterrupted playback, the duration rose at least 3 times, grew at 0.5–3×
wall-clock speed, and stayed within 30 s of the position; sticky until
`emptied` or `loadstart`. Replayed against every recorded log it caught all
of Firefox's live streams (2.1–7.3 s) and none of the files, and against the
built `dist` it caught Radio Mast's MP3 in Firefox at ~3 s. Left out because
nearly every app knows which of its sources are streams, including a mixed
playlist, and can pass `live`. Detection only helps a player fed URLs nobody
on the app side can classify, such as user-pasted URLs. Adding it later is
additive; removing a shipped heuristic is not. Revive it from this ticket if
that need appears; the Chromium header-less-VBR false positive comes with it.

**Verified by** — `testJSDom/store/declaredLive.test.tsx`: live whatever
duration the element reports, back to the element when the attribute goes,
read on `loadstart`, the four seek actions ignored, and the prop reaching
`useIsLive()` through `<AudioPlayer>`. In Chromium 151 and Firefox 153 against
the built `dist`: Radio Mast's MP3 in Firefox was live at once with
`live: true` and not live without it; the AAC stream and every Chromium stream
were live without it; `The-Race.mp3` stayed seekable.
