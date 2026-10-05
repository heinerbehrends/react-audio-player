---
id: F13
title: "A track swap should carry on playing"
epic: features
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's playlist example (D8). A `src` change arrives paused,
so every playlist has to restart playback itself, and it cannot do it in the
handler that changes the track: a `play()` before the new `src` reaches the
element is undone when the element starts loading it. Measured on a bare
element in Chromium and Firefox — `play()` then the swap leaves the new track
paused; the swap then `play()` plays it. So the consumer needs an effect after
the commit, and the playlist example carries one, with a `{ index, play }`
selection object whose identity re-runs it.

`<AudioPlayer>` owns the element and sees the commit, so it can do this once for
everyone.

## The rule

On an `audioFile.src` change, after the commit, call `play()` when playback
should continue:

| Before the swap                                    | After       |
| -------------------------------------------------- | ----------- |
| playing, or `play()` was just sent                 | play        |
| the track ended while playing                      | play        |
| paused, including a Firefox paused seek to the end | stay paused |

`play()` straight after the swap is safe: the library sets `src` as an attribute
and never calls `load()`, and the measurement above confirms the order works.
The element keeps its identity across the swap, so a browser that has allowed
playback on it (iOS) allows it again.

## Two traps

- **Firefox fires `ended` on a paused seek to the end (B4).** "Continue after
  `ended`" alone would start the next track when a paused user drags the
  timeline to the end. Remember whether playback was running when it ended: a
  natural end fires `pause` immediately before `ended`; the paused seek does
  not change `paused` at all.
- **The `paused` atom is a task late.** It follows the `play` event, which is
  dispatched after React has already committed a click's state update. A
  consumer calling `play()` and changing the track in the same handler would
  read as "paused" at commit time. The store has to record intent
  synchronously in `send` — `PLAY` and `PAUSE` set it, the element's own events
  confirm it. With that, a `play()` sent just before a swap counts as playing,
  which makes "click a track to play it" work from the click handler with no
  effect: `select(i); play();`.

## Open

- An escape hatch for apps that want every swap paused: a prop such as
  `continuePlayback={false}` on the root, defaulting to `true`. Or no prop until
  someone asks.
- Behaviour change: the README and `onEnded`'s JSDoc document "a `src` change
  arrives paused". Nothing is published, so no one depends on it.

## What goes

The playlist example's effect, the selection object and probably its
outer/inner component split; the README's "two ways to carry on" paragraph
becomes one sentence; `onEnded`'s JSDoc loses its paragraph on resuming.

## Tests

jsdom for the rule, including the Firefox case driven through the fake element;
E2E in Chromium and Firefox for next-while-playing, end-of-track, a paused swap
and click-to-play.

## Resolution

**Shipped** (2026-10-05), without the opt-out prop: nobody has asked for every
swap to arrive paused, and pausing before the change does exactly that.

- The store keeps a play intent, not an atom: `send` sets it on `PLAY`, clears
  it on `PAUSE` and `STOP_AUDIO`, and flips it on `TOGGLE_PLAY` from the
  element's state. The element's `play` and `pause` events confirm it, each
  checked against the element so a stale event changes nothing; a `pause` with
  `ended` set keeps it. A refused `play()` clears it, so the next swap does not
  ask again.
- `store.continuePlayback()` plays when the intent is set. `<AudioElement>`
  calls it after each `src` commit — not on mount, not for the same `src` on
  Strict Mode's second run.
- Measured first, in Chrome and Firefox: a swap on a playing element fires no
  `pause`, and a natural end fires `pause` with `ended` already true.

The playlist example lost its effect and its selection object: previous and
next set the index, a list click is `setIndex(i); play();`. The README's
playlist section, `audioFile`'s and `onEnded`'s JSDoc and the CHANGELOG follow;
the known gap "a playlist advance arrives paused" is gone.

**Verified by** — `continuePlayback.test.ts` (11 cases: playing, paused, a
`play()` just before the swap, a pause from outside, the natural end, Firefox's
paused seek, `TOGGLE_PLAY` both ways, a refusal, a stale `pause`);
`AudioElement.test.tsx` for the swap trigger under Strict Mode; the demo specs
in Chromium and Firefox for next while playing, next while paused, a list click
while paused and the end of a track; the full E2E suite, 138 tests in both
engines.

F14 narrowed the intent: an end holds it only until the user acts or seeks, and
only an autoplay refusal clears it.
