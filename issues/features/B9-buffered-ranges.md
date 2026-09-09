---
id: B9
title: "Buffered ranges"
epic: features
status: open
severity: none
origin: backlog
breaking: false
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
