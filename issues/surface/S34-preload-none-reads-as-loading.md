---
id: S34
title: 'Under `preload="none"` the player says "Loading audio" before anything loads'
epic: surface
status: open
severity: P2
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's live radio example (D8). A stream never ends, so
the example sets `audioProps={{ preload: "none" }}`: without it every page
view downloads radio until the tab closes. Measured on 2026-10-06 in Chromium
and Firefox, before play is pressed:

- the element sits at `readyState: 0`, `networkState: 1` (`NETWORK_IDLE`):
  nothing is being fetched, and nothing will be until `play()`
- `loadState` is `"loading"`, since it reads `readyState >= 1 ? "ready" :
"loading"`, so `playerState` is `"loading"` too
- `<PlayButton>` is named **"Loading audio"** with `data-state="loading"`,
  and `useAudioPlayer().playerState` says `"loading"`

A screen-reader user hears "Loading audio" on a player that is idle and
waiting for them. The example's E2E test cannot find the button by its
"Play audio" name for the same reason, and locates it by `data-part` instead.
The same applies to any file with `preload="none"`, a common choice for a page
of many players (the multi-player example in D8) or for metered connections.

`preload="metadata"` is unaffected: metadata arrives, `readyState` reaches 1.

## Direction

`NETWORK_IDLE` at `readyState: 0` with no error is "not started", not
"loading". Projecting it as ready-to-play (`"paused"`) would name the button
"Play audio", which is what pressing it does. The `play()` that follows moves
through `loadstart` and `waiting` as usual, so `isBuffering` and the loading
state cover the wait that then really happens. Check that a `src` swap, which
also starts at `readyState: 0`, does not flash "Play audio" while it really is
loading: there `networkState` is `NETWORK_LOADING` (2).
