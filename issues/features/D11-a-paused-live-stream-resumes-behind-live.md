---
id: D11
title: "A paused live stream resumes behind live, and nothing says so"
epic: features
status: rejected
severity: none
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's live radio example (D8). Measured on 2026-10-06 in
Chromium against Radio Mast's MP3 reference stream:

- On `pause()` the download stops: the buffered end did not move during a 15 s
  pause.
- `play()` carries on from the paused position in `currentTime`; after 60 s,
  still no error or stall. Read at the time as the listener being 15 s, then a
  minute, behind the station. **That was an inference from `currentTime`, and
  wrong** — see the decision below.
- `currentTime` and `Time.Elapsed` keep counting from the old position, so
  nothing on screen shows the lag.

Radio players usually treat pause as stop: play reconnects and rejoins the
station live. Firefox's pause behaviour is not yet measured, and how long a
station holds a stalled connection before dropping it is the server's choice
(Icecast's queue is often ~30 s of audio), so longer pauses may end in an
error elsewhere.

## Options

- **Userland, in the live example:** on play after a pause, give `audioFile`
  a fresh `src` (a query parameter) so the element reconnects. Track swaps
  already carry on playing, so this may be a few lines; whether it is clean is
  what the example would find out.
- **Library:** under `audioFile.live`, make play after a pause reload the
  source. Contained to the flag that already says "this is a stream", but a
  behaviour change nobody asked for yet.
- **Docs:** a README paragraph under "Live streams", with the recipe.

## Decision (2026-10-06): not a problem

**Heard by hand** in Chromium and Firefox against Radio Mast's streams: the
audio never falls behind. Play after a pause, short or five minutes long,
rejoins the station live. `currentTime` carries on from the paused position
regardless, which is what the measurement above read as lag: it counts
listening time, not distance from live. Nothing broke either, so the feared
failure — a stale connection playing a few buffered seconds and then erroring —
did not happen.

No library change and no reconnect in the example. The README's `useIsLive()`
section says what to expect, and the live example's badge is green whenever
the stream is audible. A station that holds a paused connection open and
buffers for it could behave differently; none was measured.
