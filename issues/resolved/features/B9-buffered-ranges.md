---
id: B9
title: "Buffered ranges"
epic: features
status: resolved
severity: none
origin: backlog
breaking: false
evidence: [verified]
---

The second half of F5. The stall signal shipped (`useIsBuffering()`); this is
the _other_ thing called buffering — how much of the track is downloaded, for
the lighter bar behind the progress bar.

**Shape.** `el.buffered` is a live `TimeRanges` object, and atoms hold
primitives so the `Object.is` bail-out works. So project a number:

```ts
bufferedEnd: Atom<number>; // end of the range containing currentTime
```

Updated from `progress`, `timeupdate` and `seeked`. Needs `buffered` added to
`SyncableMediaElement` — the first new field that interface has needed here,
since the stall signal reused `readyState`, which was already present. Then a
`<Timeline.Buffered>` part styled like `TimelineProgress`.

**Explicitly not modelling every range.** After seeking around, `buffered` holds
several disjoint ranges. An array atom would take a new identity on every
`progress` event, so `Object.is` would never bail and every subscriber would
wake several times a second — the exact hazard the store exists to avoid.
Serialising or custom equality would work but is not worth it: **`audioRef`
already ships**, so anyone needing full `TimeRanges` can read `el.buffered`
directly. That is what the escape hatch is for.

**Testing.** jsdom has no networking, so the projection is unit-testable against
the fake but real buffering is E2E-only, and triggering it deterministically
needs CDP network throttling. Expect thin coverage.

## Resolution

**Shipped** (2026-10-06) as `<TimelineBuffered>`, a separate import rather
than the atom proposed above: a store projection would have put the cost on
every player, and "AudioPlayer only" had 44 B of headroom. The bar reads the
element itself, through a new `element` atom on the store (+25 B on
"AudioPlayer only"), and keeps the end of the range the position is in as local
state, so an unchanged end does not re-render. It divides by the store's
`duration`, so it is empty before metadata and on a live stream. Its own
bundle row, "Timeline + TimelineBuffered", is 247 B over "Timeline only".

Styled like the fill: `--buffered` inline, read by a zero-specificity default
rule. The layers renumbered to keep "whatever order you write them in":
background `0`, buffered `1`, fill `2`, thumb `3`.

Found on the way: Chromium extends `buffered` when it stops loading and fires
`suspend`, with no `progress` after, so the bar listens for `suspend` too.
Before that, a `preload="metadata"` player showed nothing of the 33 s it had.

**Verified by** — `TimelineBuffered.test.tsx`: the range the position is in,
growth on `progress` and on `suspend`, a seek into another range, nothing
outside every range or on a live stream, the layer, and overrides.
`testE2E/Player/buffering.spec.ts`, in Chromium and Firefox: a server that
holds the download at 8 s of the 60 s tone pins the bar at 8/60, and releasing
it takes the bar to 1. The podcast example shows it.
