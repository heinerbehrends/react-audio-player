---
id: D4
title: "Live streams are a supported case documented as an unsupported one"
epic: features
status: resolved
severity: none
origin: demand
breaking: false
---

The
README currently closes with "Live streams are not supported: an unbounded
duration reads as 0." That sentence costs more than the feature does. Internet
radio, live shows and call-ins are a large share of what goes into a web audio
player, and the architecture is already most of the way there: `useIsSeekable()`
exists _because_ `duration` is `Infinity` while `readyState` is healthy, and it
disables exactly the two controls that have to name a position on the track.
Play, pause, volume, mute and rate all work.

What is missing is a name for the state, and it cannot be derived from the atoms
as they stand — `syncFromElement.ts:76` flattens every non-finite duration to 0,
so by the time a consumer sees it, a live stream and a player before
`loadedmetadata` are the same number. So: project the distinction (an `isLive`
boolean, or keep the raw value alongside the flattened one), and rewrite the
README paragraph from a limitation into a branch.

## Beta assessment (2026-10-01)

**The README paragraph goes before the beta, the signal after.** Rewriting the
Requirements paragraph from a limitation into a branch is part of **G3**; the
`isLive` projection is not blocking. Tracked from **G0**.

**README paragraph shipped** (2026-10-01, with G3). The `isLive` projection
stays open and is on the roadmap.

## Resolution

**Shipped** (2026-10-05) — A boolean projection, not the raw value: `isLive`
is a new atom written by `projectDuration`, which `prime`, `loadedmetadata` and
`durationchange` all go through, so `duration` and `isLive` cannot move apart.
`Infinity` sets it; `NaN` before metadata does not. Read it through
`useIsLive()`, or as `isLive` on `useAudioPlayer()`. Both are documented, and
the README's Requirements paragraph now points at the hook instead of at
`duration > 0`. `useIsSeekable()` is unchanged and still gates the timeline:
the two are different questions, and the docs say so.

**Verified by** — `isLive projection` in `testJSDom/store/syncFromElement.test.ts`
(primed, before metadata, both directions on `durationchange` and
`loadedmetadata`, cleared on a `src` swap); `useIsLive` in
`testJSDom/store/derived.test.tsx`, including the row that pins it is not the
inverse of `useIsSeekable`; and `reports isLive for an unbounded duration only`
in `testJSDom/store/useAudioPlayer.test.tsx`.
