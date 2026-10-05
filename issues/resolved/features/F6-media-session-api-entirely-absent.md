---
id: F6
title: "Media Session API entirely absent"
epic: features
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

0 hits for `mediaSession`. For an _audio_
library this is the most visible platform integration there is — lock screen, OS media keys,
car head units. `SideEffectAction` already maps almost 1:1 onto `setActionHandler`. Blocked
by F3 (no metadata fields to publish).

## Where it stands

Media Session API. The metadata fields on `AudioFile` were added ahead of this so it is not a breaking change when it lands.

## Beta assessment (2026-10-01)

**Not blocking, but the first thing beta users will ask for.** Additive:
`AudioFile` already reserves `title`, `artist`, `album` and `artwork`, and
`audioRef` reaches the element for anyone who cannot wait. Plan it for a later
beta and say so in the README's roadmap. Tracked from **G0**.

**Roadmap line shipped** (2026-10-01, with G3); first item on it. Not in
`0.1.0-beta.0`.

## Plan (2026-10-05)

`plans/PLAN-media-session.md`. The shape it settles: a `<MediaSession />` part
rendered inside the root rather than root behaviour, so the bundle cost is paid
only by consumers who import it; handlers send the actions the keyboard map
sends; previous/next register only with their props; one owner per page,
claimed on play. Settled in a grill session the same day: component only, claim on mount and on play,
clear on unmount, no `stop` handler, metadata `null` without fields, position
state once a second, throws caught and logged in development, and it ships in
`0.1.0-beta.0` — the publish waits for it.

## Progress

**Phase 1 landed (2026-10-05): the part, and metadata.** `<MediaSession />` in
`src/MediaSession/MediaSession.tsx`, exported from the index. It writes
`MediaMetadata` from the four `AudioFile` fields, keyed on their content, `null`
when none is set, and clears it on unmount; an artwork URL the constructor
rejects is logged in development and leaves the player running. The first
instance mounted owns the session. Verified by
`testJSDom/MediaSession/MediaSession.test.tsx` and
`testE2E/Player/media-session.spec.ts`; the demo renders it. `bundle-size.mjs`
gained "AudioPlayer only" (which must not contain `mediaSession`),
"AudioPlayer + MediaSession" and "Full surface + MediaSession"; "Full surface"
now leaves the part out, so it still measures what everyone else pays.

**Phase 2 landed (2026-10-05): action handlers.** `play`, `pause`,
`seekbackward`, `seekforward` and `seekto` send the keyboard map's actions
through `store.send`; `seekto` drops the call without a duration.
`previoustrack` and `nexttrack` register only with `onPreviousTrack` /
`onNextTrack`, read through a ref so an inline callback does not re-register.
`seekOffset` defaults to 10, and the system's own offset wins. No `stop`. Every
handler is removed on unmount, and an action the browser rejects is skipped
without affecting the rest. Unit tier only, as the E2E spec notes. The bundle
row for the part is now "AudioPlayer + MediaSession" rather than the part alone:
`usePlayerStore` pulls in the store factory, which the root already carries, so
alone it double-counted ~400 B. The part costs ~630 B gzipped over the root, ~600
B on the full surface.

**Phase 3 landed (2026-10-05): position and playback state.** One effect
subscribes to `currentSecond`, `duration`, `rate` and `paused` outside React and
calls `setPositionState` with the position clamped to the duration, only while
the duration is above zero and the rate is not `0` (both throw). Moving to a
live stream clears a position written earlier, so a swapped track does not keep
its scrubber. Unmount clears it too, and sets `playbackState` to `"none"`;
otherwise it follows `paused`. A rejected write is logged in development.
Skipped where `setPositionState` is not a function. jsdom covers the
per-second cadence, the clamp, the live-stream clear and the reset; the E2E spec
reads `playbackState` through play and pause on both engines and fails on a
`<MediaSession>` console error. The part is now ~840 B gzipped over the root.

**Phase 4 landed (2026-10-05): ownership.** A player starting playback claims
the session and rewrites metadata, handlers, playback state and position at
once; pausing keeps it. Every instance stays subscribed and every write returns
early unless its instance owns the session, so a claim moves no subscriptions:
each effect keeps its writer in a ref the claim calls. Still one `owner`
pointer and no list of instances. A claim by a player with no duration clears
the previous owner's position. jsdom covers the two-player hand-over, handlers
following the owner, the previous owner going quiet, and the owner's unmount
clearing the session with the other waiting until it plays;
`multi-instance.spec.ts` reads the title after playing each in turn, against
numbered demo titles. ~935 B gzipped over the root in all.

## Resolution

**Shipped** (2026-10-05) — `<MediaSession />`, an opt-in part rendered inside
`<AudioPlayer>`, exported as a component with no hook, per
`plans/PLAN-media-session.md`, in four phases recorded above. Metadata from the
four `AudioFile` fields; play, pause, both skips and `seekto` through the
keyboard map's actions; previous/next only with their props; position and
playback state from the atoms; one owner per page, claimed on mount when free
and on play. Beyond the plan: each `setActionHandler` is wrapped, since an
unknown action throws; position state is also skipped at rate `0` and cleared
rather than left behind when the duration goes away. Documented in the README
(`### <MediaSession>`, the `AudioFile` block, Features), the roadmap item
removed, and a CHANGELOG Added entry replacing the Known gaps line. ~935 B
gzipped over the root, paid only by consumers who import it.

**Verified by** — `testJSDom/MediaSession/MediaSession.test.tsx` (34 cases:
metadata, handlers, position and playback state, two-player ownership),
`testE2E/Player/media-session.spec.ts` (metadata and playback state on both
engines) and the ownership case in `multi-instance.spec.ts`; the
"AudioPlayer only" bundle row fails if `mediaSession` reaches the root. Handlers
cannot be triggered from page script, and the lock screen itself wants one look
on a locked phone.
