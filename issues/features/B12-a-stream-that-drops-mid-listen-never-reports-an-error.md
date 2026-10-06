---
id: B12
title: "A stream that drops mid-listen never reports an error, and nothing can retry it"
epic: features
status: open
severity: P1
origin: backlog
breaking: false
evidence: [measured]
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

## Proposal

The split: the library reports the failure and offers a retry. When to give up
on a stall, and how often to reconnect, stay outside it.

1. **Report a network error once playback has stopped on it.** A
   `MEDIA_ERR_NETWORK` counts as unusable once the element can no longer play:
   it has paused or ended because of the error, or it has run out of data.
   Until then the buffer plays on, as now. Decode errors keep the
   `HAVE_NOTHING` rule, so the Firefox decode false positive is unaffected.
   `<ErrorMessage>`, the play button's name and `useAudioError()` then follow
   with no change of their own. Measured above, this catches three of the four
   runs.
2. **A `retry()` control on `useAudioPlayer()`.** It calls `element.load()` and
   plays again if play was wanted. A file restores its position; a live stream
   does not, so it rejoins live (D11). This belongs in the library because the
   library knows `isLive` and `playWanted`, and a consumer would have to
   rebuild both.
3. **Stall timeouts and automatic reconnects: a recipe, not API.** Chromium
   with a hanging reconnect never raises an error, so only a timeout catches
   it. The limit, the backoff and the attempt count are product policy, and
   they differ between radio, podcasts and hls.js, which runs its own recovery
   (D7). `useIsBuffering()`, `useIsLive()` and `retry()` are the inputs. The
   live example gets a stall timeout and a Retry button, and the README gets
   the recipe.

## Open questions

- Is the exact rule for item 1 `paused || ended`, or does
  `readyState < HAVE_FUTURE_DATA` with no data left belong in it too? Chromium
  sets the error and the pause together, but is the order guaranteed?
- Should `<PlayButton>` in the error state call `retry()` instead of being
  `aria-disabled`? That is more discoverable, but it changes what the disabled
  state means for a 404, where a retry cannot help.
- Does a recovered stream clear `mediaErrorCode`? It should, through
  `loadstart` → `prime`, but this needs checking.

## Verification

An E2E test in Chromium and Firefox. A local server cuts the stream mid-listen
and resets reconnects; the test then asserts the alert renders and that
`retry()` plays again once the server answers. `page.route` cannot redirect
the https station to an http local server, so the measurement swapped the
`src` in an init script instead. In jsdom: a network error at
`readyState` > 0 stays usable while playing and becomes `"error"` once
paused; a decode error at `readyState` 4 still does not.
