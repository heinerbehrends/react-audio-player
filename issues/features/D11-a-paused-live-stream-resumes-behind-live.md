---
id: D11
title: "A paused live stream resumes behind live, and nothing says so"
epic: features
status: open
severity: none
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's live radio example (D8). Measured on 2026-10-06 in
Chromium against Radio Mast's MP3 reference stream:

- On `pause()` the download stops: the buffered end did not move during a 15 s
  pause.
- `play()` carries on from the paused position. After 15 s the listener is
  15 s behind the station; after 60 s, still no error or stall — playback
  continued from where it stopped, the gap now presumably a minute.
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

The live example ships with plain pause until this is decided.
