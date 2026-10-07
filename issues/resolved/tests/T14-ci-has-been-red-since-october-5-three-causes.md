---
id: T14
title: "CI has been red since 5 October: three causes, none in the library"
epic: tests
status: resolved
severity: P1
origin: backlog
breaking: false
evidence: [measured]
---

Every `Tests` run on `main` from 5 October 22:32 (e9dfc99) to 6 October 20:31
(dc97ddf) failed, eight in a row, and the two matrix legs failed for different
reasons. Nothing in them was a library defect; all three were the test suite or
the runner.

1. **React 19 leg, `Run tests`.** `Timeline.test.tsx` queried
   `style[href="react-headless-audio-player-progress"]`. React 19 hoists a
   `<style href precedence>` into `<head>` and renames the key to `data-href`,
   so the query found nothing and the assertion got `undefined`. Red in every
   run since the query was added in e9dfc99; passes locally because local is
   React 18.

2. **React 18 leg, `Run E2E tests`, Firefox only.** `buffering.spec` and both
   `network-drop.spec` tests failed on every attempt from ccb8e87, the commit
   that added them, while passing on Windows in 40 s. The runner has no audio
   output device. Firefox there raises `MEDIA_ERR_DECODE` the instant `play()`
   runs and drives a fake clock, which the `media-events` attachment shows on
   every attempt:

   ```
   0.34s playing  readyState=3 error=-
   0.34s error    readyState=3 error=3
   6.35s pause    readyState=2 error=3 t=60.00
   6.36s ended    readyState=2 error=3 t=60.00
   ```

   The library ignores that decode error on purpose (B12), so the store reads
   "ready" and the other 158 tests pass. The three new specs are the first
   whose assertions depend on what Firefox does with a real sink: a stall never
   lowers `readyState`, and a cut connection cannot report a network error
   because the error slot is already taken.

3. **Chromium, `seek-click.spec` "when playing", flaky.** The failing attempt
   read a position of `0` after the seek, in a test whose play, seek and pause
   clicks ran inside 130 ms on a page shared with the test above. That test's
   seek to 10, the reset's seek to 0 and this seek all reached Chromium within
   ~150 ms; the retry on a fresh page read 10.02. The sibling "when paused"
   test waits for its seek to land and does not flake. Not a timing window on
   the 0.3 s tolerance, as first assumed.

## Resolution

**Shipped** (2026-10-07).

1. The selector matches either attribute:
   `style[href="…"], style[data-href="…"]`, with the React 18 and 19 shapes in
   the comment.

2. A step in `test.yml` before the E2E run gives the runner a device:
   `apt-get install pulseaudio`, `pulseaudio --start --exit-idle-time=-1`,
   `pactl load-module module-null-sink`. The runner, not the specs: skipping
   them in Firefox would have stopped testing Firefox's real behaviour, and the
   decode false positive that B12 works around disappears from CI as well.
   B12's rule stays in the library for real machines without a device.

3. `seek-click.spec` waits for the seek to land (`!seeking && currentTime >=
10`) before pausing, asserts a lower bound of 10 and an upper bound of 12
   rather than a 0.3 s window around 10, and clicks the button normally rather
   than a forced corner pixel. `resetAudioState()` now resolves only once the
   element is paused, not seeking and at 0, for all eight specs that share an
   element through it. `trace` is `retain-on-failure`, so the next flake
   records the failing attempt, not only the passing retry.

**Verified by** —

- (1) Reproduced in a scratch worktree with React 19.3.0 installed the way CI
  does it (`pnpm add -D react@19 react-dom@19 …`): exactly that one test fails;
  with the fix, 11 of 11 pass. Still 11 of 11 under React 18 in the live tree.
- (2) Reproduced in Docker, `mcr.microsoft.com/playwright:v1.62.1-noble`, as
  `pwuser`: without a device, `buffering.spec` and "drops mid-play" fail with
  the signature above; with the null sink, all three pass in 40.0 s, the same
  as on Windows.
- (3) `seek-click.spec` passes in Chromium and Firefox; the seven other specs
  that use `resetAudioState()` pass in Chromium, 24 of 24 in 40.5 s.
- `pnpm type-check`, `eslint` and `prettier --check` clean on every changed
  file.

**Not done here:** B4, which asked whether to paper over or document Firefox's
`ended` on a paused seek, is now documented in the `onEnded` JSDoc and the
playlist recipe (G4's second pass), but the ticket is still open.
