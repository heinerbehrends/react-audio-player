---
id: S34
title: 'Under `preload="none"` the player says "Loading audio" before anything loads'
epic: surface
status: resolved
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

## Resolution

**Shipped** (2026-10-06). `loadState` is `"ready"` at `readyState: 0` while
`networkState` is `NETWORK_IDLE` and the element has no error: nothing is on
its way, so the player is waiting for its first press, and `playerState` reads
`"paused"`. One rule, `loadStateOf`, serves `prime` and a new `suspend`
handler — `suspend` is where a `preload="none"` element goes idle after
`loadstart` primed to `"loading"`, and `prime` covers a store attached after
it. After the press, `isBuffering` is true until data arrives (`"ready"`, not
paused, `readyState` below 3), so the wait that then really happens reads as
it does during a stall. A `src` swap is unaffected: `loadstart` sees
`NETWORK_LOADING` and primes `"loading"`.

The live example's E2E test finds the button by its "Play audio" name again.
The dev app takes `?preload=none`. Docs: the `PlayerState` JSDoc and the
README's `useIsBuffering()` section say what `"loading"` means now.

Cost: 31 B gzipped on "AudioPlayer only" (2462 → 2493 B, budget 2600).

**Verified by** — `testE2E/Player/preload-none.spec.ts` in Chromium and
Firefox: the element is at `readyState` 0 and `NETWORK_IDLE`, the button is
named "Play audio", and pressing it plays. It fails without the fix. In jsdom:
`loadstart` then an idle `suspend` goes loading → ready; a `suspend` that is
not idle stays loading; an error survives a later `suspend`; `prime` on an
idle element lands ready; and `PlayButton` reads "Play audio" there, then
"Pause audio" once playing. The two idle cases fail without the fix.
