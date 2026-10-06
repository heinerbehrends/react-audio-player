---
id: B12
title: "A stream that drops mid-listen never reports an error, and nothing can retry it"
epic: features
status: resolved
severity: P1
origin: backlog
breaking: false
evidence: [measured, verified]
---

Found reviewing the live radio example (D8). A dropped connection is the
common way radio fails, and the library hides it. Measured on 2026-10-06 in
Chromium and Firefox. The live example was served from a local server that
sends 6 s of MP3 and then cuts the socket. After the cut, the server either
resets every reconnect (station down) or accepts them and sends nothing.
Each run was watched for 2 minutes:

|          | Reconnects reset                                                                                                                                            | Reconnects hang                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chromium | Plays the buffer, then "Buffering…" for ~23 s over 30 `Range` retries. Then `error.code` 2 and the element pauses itself. Reads **"Paused"**, Play enabled. | **"Buffering…" for 2 minutes.** No `error` event at all. |
| Firefox  | `error.code` 2 at the cut, plays the buffer on, ends. Reads **"Paused"**.                                                                                   | Same as reset.                                           |

In no run did `<ErrorMessage>` render, `useAudioError()` return anything, or
the play button read "Error loading audio". The cause is `isUnusable` in
`src/store/syncFromElement.ts`: an error counts only at `HAVE_NOTHING`. That
rule exists for a real case, Firefox's spurious `MEDIA_ERR_DECODE` on a
machine with no audio output, after which it plays the track through. But it
also discards a network error that has ended playback.

The test streamed a finite file, so Firefox's jump to `ended` at the file's
length is partly an artifact. A true endless stream may stop differently. The
missing error does not depend on that.

A second gap: once `loadState` is `"error"`, nothing recovers. The play button
is `aria-disabled` and `src` does not change, so a consumer has to re-key
`audioFile` by hand. The live example's error text says "Reload the page to
try again" for that reason.

## Resolution

**Shipped** (2026-10-06). The split: the library reports the failure, and the
app decides how to recover. Only the first part is library code.

1. **Detection, in the library.** `isUnusable` also counts a
   `MEDIA_ERR_NETWORK` once the element is paused or ended. Decode errors keep
   the `HAVE_NOTHING` rule, so the Firefox decode false positive is unaffected.
   The test runs at `error`, `pause`, `ended` and `suspend`. Measured on a
   file cut mid-play:
   - Chromium sets `paused` before it fires `error`.
   - Firefox fires `error` while still playing, then `pause` and `ended`
     together once the buffer runs out.

   So no `readyState` clause is needed. `<ErrorMessage>`, the play button's
   name and `useAudioError()` follow with no change of their own. Cost: 28 B
   gzipped on "AudioPlayer only" (2493 → 2521 B, budget 2600).

2. **Retry: a recipe, not API.** The proposal was a `retry()` control. It is
   not needed:
   - `audioRef.current.load()` and then `play()` do the whole job.
   - `PLAY` is not blocked in the error state.
   - `load()` fires `emptied` and `loadstart`, which re-prime the store and
     clear the error.
   - For a station, `load()` already means live again.
   - A file the browser could still fetch is retried by the browser itself,
     with `Range` requests.

   The README's `useAudioError()` section has the recipe.

3. **Stall timeout: also a recipe.** `examples/live` reconnects after 15 s of
   `useIsBuffering()`. A fresh connection reads as loading, not buffering, so
   a station that answers and sends nothing gets one reconnect, not a loop. Its
   `<ErrorMessage>` has a "Try again" button that runs the same reconnect.

Left as is: `<PlayButton>` stays `aria-disabled` in the error state, since a
retry cannot help a 404. A consumer who skips the recipe gets an accurate dead
end rather than the old "Paused".

**Verified by**:

- `testE2E/Player/network-drop.spec.ts`, in Chromium and Firefox. A local
  server cuts the WAV after 2 s and answers reconnects with 503, which Chromium
  gives up on in ~3 s; a reset takes it ~25 s. The test checks that the alert
  renders and the play button reads "Error loading audio". It also checks that
  `load()` clears the error and plays again once the server answers. The
  alert check fails without the fix: before it, a probe showed no alert in
  either browser.
- In jsdom, each browser's measured event order:
  - Firefox: the error does not latch while playing, then does on
    `pause` + `ended`.
  - Chromium: it latches at `error`.
  - A decode error on a paused element with data stays `"ready"`.
  - `emptied` + `loadstart` clear the error.
- The live example's demo test checks that "Try again" reconnects after the
  alert.
- Re-measured on the live example, with the stall timeout running:
  - Chromium with reconnects reset: the alert after the reconnect.
  - Firefox: the alert when the buffer ran out.
  - Chromium with reconnects hanging: one reconnect, then "Loading audio"
    with no loop.
