---
id: P1-b
title: "A volume/rate drag costs 2.4× a seek drag — the mode Phase 5 never traced"
epic: performance
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured, verified]
---

Phase 5 profiled only the **timeline** drag, which is `writesDuringDrag: false` — the cheap
mode. `volume` and `rate` write the element per pointermove, so `volumechange` → atom →
subscriber wake → **a second React render per move**.

| main-thread busy per pointermove | 1×           | 4×      | 6×          |
| -------------------------------- | ------------ | ------- | ----------- |
| timeline (seek)                  | 0.195 ms     | 3.35 ms | 3.83 ms     |
| **volume**                       | **0.475 ms** | 3.95 ms | **5.77 ms** |
| layout ops / move                | **0**        | **0**   | **0**       |

At 6× throttle the volume drag uses **82 % of the 7.0 ms uncoalesced-pointer budget** vs
55 % for seek. That is the one place "fine on this laptop" is fair criticism.
**This is not an argument for memo** — the 8 `volume` subscribers each genuinely need the
value. Mitigating: 143 uncoalesced events/s is a _desktop mouse_ rate; touch is coalesced to
refresh rate. The genuine risk case is narrow.

**Free win inside it:** `useSlider.ts:96-110` **subscribes to the same atom twice** — the two
ternaries differ only in the `"seek"` branch, so in volume/rate mode both resolve to the same
atom. That is 12.5 % of the volume hot path's notification traffic returning an identical
value. _(Same code the architecture review flags as **C4**.)_

## Where it stands

The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.

## The free win is taken (2026-09-15)

The double subscription this ticket identified — 12.5 % of the volume drag's
notification traffic, returning an identical value — is gone with **C4**. The
mode is resolved once, and only `"seek"` subscribes to a second atom. Volume and
rate also stopped subscribing to `duration` entirely, which this ticket did not
count because it is not on the drag path.

The measured finding stands: a volume drag still writes the element per
pointermove and takes a second render from the echo. Recorded, not actioned —
the 8 `volume` subscribers each genuinely need the value, and 143 uncoalesced
events/s is a desktop-mouse rate.

## Beta assessment (2026-10-01)

**Not blocking.** Recorded, measured, and the free win is taken; the remaining
cost only shows at a desktop-mouse event rate under a 6× CPU throttle. Tracked
from **G0**.

## Resolution

**Fixed** (2026-10-06). The second render came from two updates in two tasks:
the slider's own drag state on `pointermove`, then the store on the
`volumechange` echo a task later. Two changes put it at one:

- The store re-reads volume, muted and rate from the element right after any
  write, through the same `volumechange` / `ratechange` handlers. The element
  reads back at once; only the event waits. The echo then changes no atom.
- In a mode that writes as it drags (volume, rate), the slider shows the store's
  value instead of keeping its own: a move is one store update, so one render.
  A seek drag is unchanged.

Moving the store update earlier alone did not merge the renders: the store
reaches React through `useSyncExternalStore`, at sync priority, and the drag
state at continuous priority, so they still committed apart.

Measured on a production build of the dev app, 300 scripted moves, three runs,
median. Busy time is the renderer main thread's from a Chrome trace; commits
are `MutationObserver` callbacks, one per separate DOM commit:

| per move, volume drag                  | before               | after                |
| -------------------------------------- | -------------------- | -------------------- |
| commits                                | 1.79                 | **1.00**             |
| busy at 1× / 4× / 6× CPU               | 5.0 / 39.5 / 45.5 ms | 3.9 / 18.5 / 32.3 ms |
| timeline drag, 1× / 4× / 6×, for scale | 4.6 / 27.0 / 37.5 ms | 4.0 / 18.1 / 36.3 ms |

The commit count is the reliable signal. Busy time includes Playwright's input
dispatch and varies run to run, but a volume drag now costs what a seek drag
does at every rate, where it cost more before. Bundle: +20 B on "AudioPlayer
only" (2536 → 2556 of 2600), +31 B on the full surface.

**Verified by** — `createPlayerStore.test.ts`: a volume write projects before
its event, and the echo wakes no subscriber; a rate write projects the same
way. The volume, rate and timeline E2E specs pass in Chromium and Firefox
(60 tests).
