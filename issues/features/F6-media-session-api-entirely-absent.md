---
id: F6
title: "Media Session API entirely absent"
epic: features
status: open
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
"MediaSession only" and "Full surface + MediaSession"; "Full surface" now leaves
the part out, so it still measures what everyone else pays. The part costs
~330 B gzipped on the full surface so far. Handlers, position state and
claim-on-play remain (phases 2–4).
