---
id: F14
title: "A track swap carries on only when it should"
epic: features
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [verified]
---

Found reviewing F13. The store's play intent is right for the swaps F13 was
about and wrong in three others.

## The defects

- **An end kept the intent forever.** A `pause` with `ended` set left the
  intent on, and nothing turned it off again. The last track of a playlist
  ends, the player looks paused, and an hour later Previous — which only changes
  the index — starts playing. The same for a consumer whose `onEnded` advances
  only while its autoplay switch is on: switched off, the next Next autoplays.
  Chrome fires no `pause` on a paused seek back from the end, so seeking did not
  turn it off either. The README promised "if it was paused, it stays paused".
- **A broken track stopped the playlist.** Every refused `play()` but an
  `AbortError` cleared the intent. A 404 rejects with `NotSupportedError`, so
  the list stopped there, and the user's Next left the next good track paused.
- **The tests could not see either.** The fake's `play()` leaves `paused` true,
  where an element drops it at once; no test modelled a swap's silent pause or
  the `AbortError` it hands the pending `play()`.

## Resolution

**Shipped** (2026-10-05).

- A natural end keeps the intent for the swap that follows from it — in the
  same task or tasks later, from an effect or after a fetch — and no longer. A
  `pointerdown` or `keydown` on the page, or a `seeking` on the element, ends
  it: whatever comes next is the user's. Listened for only while an end is
  holding the intent, and removed on any command, `play` event or detach.
- Not a timer: an `onEnded` that waits on the network would lose a race the
  user never saw. Not "while `ended`": the hour-later Previous is still at the
  end. Firefox's paused seek to the end (B4) still fires no `pause`, so it
  never holds the intent.
- Only `NotAllowedError` — an autoplay refusal, which the next swap would only
  repeat — clears the intent. Any other rejection is reported in
  `playbackError` as before and leaves it set, so the next track plays.

The README's playlist passage says when an end carries on and that a failed
track does not stop the list.

**Verified by** — `continuePlayback.test.ts`: a swap tasks after the end plays;
a click, a key or a seek back after the end stays paused; a `play()` the swap
aborts plays, with no error; a `NotSupportedError` then a swap plays; a
`NotAllowedError` then a swap stays paused. A local `pendingPlay` drops `paused`
and holds the promise as an element does.

A media-session track button is neither a pointer nor a key on the page, so
`<MediaSession>`'s `previoustrack` and `nexttrack` handlers call the store's
`expireEndedIntent()` before the consumer's callback. Verified by `expires the
intent a natural end held before a track button` in
`testJSDom/MediaSession/MediaSession.test.tsx`.

## Reverted by decision (2026-10-06)

The end-intent expiry is gone; the `NotAllowedError`-only rule and the test
infrastructure stay. Measured on "AudioPlayer only", the expiry cost 116 B
gzipped, 4.5% of the core, and what it prevented is not clearly a bug: a track
that ran to its end was stopped by the content, not the listener, so Previous
or Next starting playback afterwards is a reasonable reading of intent. The
rule is now one sentence in the README: a track that ran to its end counts as
playing for every later swap, until a pause.

The case that does surprise is a `src` change that is not navigation, such as
a refreshed signed URL long after the end. The README names it and the fix:
call `pause()` from `useAudioPlayer()` when `onEnded` does not advance.
`<MediaSession>`'s track buttons no longer call `expireEndedIntent`, which is
removed. A 30 s window (68 B less than the expiry) was measured and rejected:
it kept the cost for a rule harder to explain.

**Verified by** — `plays on a swap long after the end, whatever happened in
between` and `stays paused when a pause follows the end` in
`testJSDom/store/continuePlayback.test.ts`.
