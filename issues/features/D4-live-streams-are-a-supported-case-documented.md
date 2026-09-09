---
id: D4
title: "Live streams are a supported case documented as an unsupported one"
epic: features
status: open
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
