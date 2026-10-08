---
id: F15
title: "No player-wide playback-rate range"
epic: features
status: resolved
severity: P3
origin: backlog
breaking: true
---

Only `<PlaybackRateSlider>` takes a range (`minValue`, `maxValue`), and only its
own arrow keys follow it. `PlaybackRate.Change` and the `<` `>` keys stop at
`RATE_LIMITS` (0.125–8, C14). `.Set` and `setRate` clamp only to those limits.
So a player whose slider runs 0.75–2 can still reach 8x from the `>` key.

## Proposal

A `rateRange` prop on `<AudioPlayer>`, e.g. `rateRange={[0.75, 2]}`, clamped to
`RATE_LIMITS`. Every rate write follows it: the slider (as its default range),
`.Change`, the keys, `.Set` and `setRate`. Defaults to `RATE_LIMITS` for the
writes and to `RATE_BOUNDS` (0.5–4) for the slider, as now.

Open question: should a slider's own `minValue` / `maxValue` still be allowed
to go wider than `rateRange`, or be clamped to it?

## Resolution

**Shipped** (2026-10-08), with the open question answered: no. There is one
range per player and the slider has none of its own.

Two ranges were the whole reason the rate logic was complicated. Because the
slider's range and the buttons' could disagree, a rate could legitimately sit
outside the slider's range, and that one possibility needed the "never move
against your own direction" rule in `stepRate`, the optional bound on the two
step actions, the bounds plumbing through the slider mode config, and the C1
history of bounds living in three places.

- `rateRange` on `<AudioPlayer>`, as `[slowest, fastest]`, defaulting to
  `[0.5, 4]`. Each end is clamped to `RATE_LIMITS`, and the top never below
  the bottom. The store holds it, created with the prop so the first render
  already has it, and an effect follows a later change. A change that
  narrows the range past the playing rate pulls the rate in at once.
- Every rate write clamps to it: `.Set`, `setRate`, the slider commit, `.Change`,
  the `<` `>` keys, the slider's arrow keys and `Backspace`. A step is now
  `rate ± amount`, clamped. A rate outside the range, written through
  `audioRef`, is pulled back to the nearer end by the next write.
- `<PlaybackRateSlider>` loses `minValue` and `maxValue` and reads the store's
  range. The step actions lose their bounds. `stepRate` and `SliderBounds` are
  gone; `RATE_BOUNDS` is `DEFAULT_RATE_RANGE`.

**Behaviour change:** buttons and keys stop at 4 by default rather than 8.
`rateRange={[0.5, 8]}` restores the old ceiling. A slider spanning 0.125–8
would put 1x at eleven percent of the track, so the narrower default stays.

**Bundle:** "AudioPlayer only" measured 2741 B; its budget went from 2600 to
2900 B, and "AudioPlayer + MediaSession" from 3700 to 3900 B.

**Verified by** — `handleSideEffects.test.ts`: an explicit rate and a slider
commit clamp to a narrow range, a step stops at the range and pulls a rate
from outside it back in, and a reset lands on the nearest end of a range that
excludes 1x. `useSlider.test.tsx`: the arrow keys, End and the `>` shortcut
stop at the same end, and the default is 0.5–4. `PlaybackRateSlider.test.tsx`:
the slider reads the player's range, follows a later change, and draws its
fill from it. `ChangePlaybackRate.test.tsx`: the button stops at the range
and pulls a rate past it back. `createPlayerStore.test.ts`: a narrower range
pulls the playing rate in. `PlayerStoreContext.test.tsx`: the provider follows
a change to the prop, and leaves an injected store's range alone.
