# Pre-1.0 Review Findings

Six parallel reviews of `react-headless-audio-player`, run 2026-08-28 against the
post-refactor tree (all six phases of the refactor plan landed, 337 jsdom / 51 E2E green).

**The package is unpublished (`version: 0.0.0`), so every breaking change on this list is
free today and expensive after the first publish.** That single fact drives most of the
severity calls below.

## How to read this

| Mark | Meaning                                                                      |
| ---- | ---------------------------------------------------------------------------- |
| ✅   | Verified independently, in this repo, after the agent reported it            |
| 🔬   | The agent executed it — browser, compiler or test output shown in its report |
| 📖   | Agent's code reading, plausible, **not** independently re-verified           |
| ❌   | Checked and **disproven** — see [Rejected claims](#rejected-claims)          |

| Severity | Meaning                                                                             |
| -------- | ----------------------------------------------------------------------------------- |
| **P0**   | Fix before publish. Broken behaviour, or an API shape that cannot be changed later. |
| **P1**   | Real defect or significant gap. Should not survive to 1.0.                          |
| **P2**   | Genuine but narrow, or additive.                                                    |
| **P3**   | Taste, polish, or explicitly optional.                                              |

Counts: **17 P0 · 28 P1 · 22 P2 · 7 P3** — 74 findings across six categories.
One claim was checked and rejected.

**Status as of 2026-08-28: all 17 P0s are resolved**, along with several P1s and
P2s. See [Status](#status) below. The findings themselves are left as written —
they are the evidence, and the reasoning in them is what the fixes were argued
against.

This file is the evidence archive: what was found, and how each fix was proven.
**`BACKLOG.md` is the only place that says what is still open, and why it was
deferred.** Nothing below restates remaining work.

---

## Status

Every row below was verified after the fix, by the means named. The suite went
from **337 jsdom / 51 E2E** to **428 jsdom / 55 E2E**, all green, with
`type-check` on both TS projects, `lint`, `prettier`, `build` and
`check-exports` clean throughout.

**This section is the only part of this file that grows.** A resolved finding
gets a row here — what shipped, how it was proven — and is struck through in
`BACKLOG.md`. What remains open is never restated here: one fact, one home.

### All 17 P0s — resolved

| Ref          | Shipped                                                                                                  | Verified by                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **A1**       | Space dropped from the default key map, so it activates the focused button again                         | Browser: seeks 10 s, no longer starts playback                                                                            |
| **A2**       | A `ctrlKey \|\| metaKey \|\| altKey` guard at the top of `handleMediaKeys`                               | Browser: `Ctrl+Alt+→` and `Ctrl+Alt+M` both ignored                                                                       |
| **A3**       | `aria-hidden` wrapper and `aria-label` removed from the alert                                            | Browser: message announceable; the test that pinned the bug was flipped                                                   |
| **S1**       | `{...props}` spread on the `Timeline` and `Volume` roots                                                 | `className`, `id` and handlers now reach the DOM                                                                          |
| **S2 / C6**  | `Time` is a plain namespace object; the `React.FC` call signature is gone                                | `dist/index.d.ts` declares an object; `<Time>` no longer type-checks                                                      |
| **S3**       | `"use client"` via tsup `banner` **plus** an `onSuccess` re-apply                                        | First line of `dist/index.mjs`; the Rollup treeshake pass strips the banner alone                                         |
| **S4**       | `type="button"` on all 8 buttons; 3 prop types widened to `ButtonHTMLAttributes`                         | Browser DOM                                                                                                               |
| **S5 / A14** | `composeEventHandlers`; handlers, `tabIndex` and `aria-hidden` moved after the spread                    | 11 tests, including the `preventDefault()` opt-out                                                                        |
| **S6 / F2**  | `audioFiles: AudioFile[]` → `audioFile: AudioFile`                                                       | The array never read past `[0]`                                                                                           |
| **S7**       | `.Seek`/`.Set` → `.Control`, `.Drag` → `.Thumb`, `Seek` → `SeekButton`                                   | 406 + 52 green with **no logic change**                                                                                   |
| **F1 / S13** | `useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsBuffering`, `useAudioError`                | 10 tests, two of which pin the subscription-granularity split                                                             |
| **F3**       | `title`/`artist`/`album`/`artwork` on `AudioFile`; README example now compiles                           | `tsc` — the old example was a hard `TS2353`                                                                               |
| **F4**       | `playbackError` atom written by `send`; `AbortError` swallowed                                           | 15 tests, incl. one asserting no unhandled rejection escapes                                                              |
| **T1**       | `no-snap-back.spec.ts` samples the thumb and `aria-valuenow`, not `el.currentTime`                       | **Mutation-proven**: both rows fail when the retain-until-changed rule is deleted — the mutation the old version survived |
| **T2**       | The `role="progressbar"` query is gone; the fill is selected by the library's own `data-part="progress"` | The old query returned `null` and passed unconditionally                                                                  |
| **T3**       | Plays until `aria-valuenow` moves, then compares like-for-like against `Math.floor(currentTime)`         | The old version passed with the attribute frozen at 0                                                                     |

### Also resolved

| Ref          | Shipped                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F5**       | Stall signal: `readyState` projected, `useIsBuffering()` derives from it. Chosen over a 5th `PlayerState` member, which would have destroyed the play/pause affordance during a stall                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **F7**       | `onEnded` on `AudioPlayer` makes track-end observable, and userland playlists possible. An `ended` atom was rejected — the rewind clears `el.ended` within a tick, so a level would flicker where an edge is wanted                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **F8**       | `mediaErrorCode` projected; `useAudioError()` composes it with `playbackError` into a discriminated union                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **F9 / S10** | `audioProps` and `audioRef` on `AudioPlayer` — unblocks `crossOrigin` (and so Web Audio), `preload`, `<track>` captions and HLS.js                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **P1-a**     | Three `Object.assign` compound roots → property assignment. Rollup: a `PlayButton`-only import went **4,025 B → 1,137 B gzipped (−72 %)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **C8**       | The write path clamps `playbackRate` to the browser's own range, so no rate write can throw. Verified by 9 clamp tests, including the two `NaN`-before-metadata paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **S9**       | Every slider part carries `data-part` (`control`, `thumb`, `progress`, `background`), giving consumers a styling hook and tests a selector that is library output rather than demo markup. Verified by the rewritten `progress-indicator.spec.ts`, whose old query matched nothing                                                                                                                                                                                                                                                                                                                                                                                                       |
| **T5**       | The dead `useHandleSideEffect` mock is gone. Verified by the suite staying green without it, which is what proved it dead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **A4**       | One state channel on all three toggles: the name. `aria-pressed` removed from `PlayButton`, `MuteButton` and `Time.Toggle`, which gained a flipping name ("Show time elapsed" / "Show time remaining"). Verified by 3 rows asserting the attribute's absence — a re-added `aria-pressed` now fails                                                                                                                                                                                                                                                                                                                                                                                       |
| **A5 / A7**  | `aria-disabled` in place of native `disabled`, on the six gated buttons and all three sliders. `useDisabledButtonProps` blocks activation, the consumer's `onClick` included. Verified by a jsdom test that focuses a control, drops the load state under it, and finds focus still there. **Later refined** — the mechanism is unchanged, but the predicate it read was wrong; see "Two gates, not one" below                                                                                                                                                                                                                                                                           |
| **A6**       | `Home` / `End` on every slider, through `commit` so the seek slider does not snap back. Slider-scoped, not added to the global map. Verified by 7 jsdom rows plus 2 E2E — one of which pins that `Home` on a _button_ is still the browser's                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **A8**       | `aria-valuetext` on the volume slider composes the mute with the volume — "Muted, 80%". `aria-valuenow` deliberately unchanged: it is the volume, and muting does not move the thumb. Verified by 5 jsdom rows and an E2E round-trip through the mute button                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **A9**       | `aria-pressed` in place of `aria-current` on `PlaybackRate.Set`. Chosen over a radio group, which ARIA suggests for a one-of-several setting but which expects arrow keys to move between the options — and arrows already seek and change the volume on every focused control, so a radiogroup would have made the keyboard model differ per control. Reconciled with A4 by stating the rule as "one state channel", not "no `aria-pressed`": the three toggles put state in their name, and this button's name is fixed. Written as `"false"` on the inactive rates rather than omitted, so the row announces as a set — **mutation-proven**: making it absent-when-false fails 2 rows |
| **A11**      | Dropped rather than named, on all three sliders. Each root wraps one control that already carries `role="slider"` and a name, so the group had a single member and Volume's "Volume controls" was a second name for "Volume slider". `PlaybackRateSlider` already shipped without one, which was the control case. Dropping it also unlocks the root: `role` was spread last, so a consumer composing extra controls in could not add their own — now they can. `PlaybackRate` keeps its group, wrapping several buttons, which is the contrast that shows the rule rather than a blanket removal. Grouping the player as a whole is a different question and stays open as **A10**      |
| **A12**      | The clocks carried `aria-label="elapsed"` / `"remaining"` / `"duration"`, which _replaces_ the accessible name — so a screen reader read "elapsed" and never the time, for every user, in English. Worse in both directions than the finding recorded: `<time>` maps to no ARIA role, and naming a generic element is not reliably announced, so the label was as likely to be dropped as to hide the value. Removed; the text is the name. `data-part` replaces it as the query and styling hook, and a consumer can pass their own label now that props are accepted                                                                                                                   |
| **S16**      | `ErrorMessage`, the three `Time` parts and the `PlaybackRate` root now take the standard DOM props. `ErrorMessage`'s hardcoded `class="audio-player-error"` is gone — checked against `styles.css`, nothing ever matched it, so it was a name in the consumer's markup that they did not choose and that did nothing. `role`/`aria-live` on the alert and `role` on the group stay locked after the spread; the group's `aria-label` stays overridable, being the only way to localise it. A `format` prop is deliberately **not** part of this — see **A15**                                                                                                                            |
| **C1**       | `RATE_BOUNDS` is the single default, read by the slider's prop defaults and `useSlider`'s; a slider with a narrower range sends its own bounds with the action, and the clamp uses them. Verified by a test pressing ArrowUp 20× against `maxValue={2}` and comparing with `End`                                                                                                                                                                                                                                                                                                                                                                                                         |
| **S11**      | `translate(calc(…px - 50%))` in place of the hardcoded `- 20px`, so the thumb self-centres at any size. Verified by the four assertions that had pinned the 40px assumption                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **S12**      | `position: relative` on the volume and rate roots, via a shared `rootStyles` the two had inlined a copy of. Verified by a row on each root — the thumb's containing block was previously whichever ancestor happened to be positioned                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **T4**       | `retries: process.env.CI ? 2 : 0`. Verified against the thing the finding predicted: a `volume-state` row was seen failing then passing on retry during this work, so the masking was real rather than hypothetical — it did not reproduce in 8 repeats, and is recorded in `BACKLOG.md` against T7                                                                                                                                                                                                                                                                                                                                                                                      |
| **S8**       | Opinion moved to an optional `styles.css`, exported as `react-headless-audio-player/styles.css`; roots gained `data-part="root"` for the selector. Verified in Chrome: the four defaults apply, and one plain consumer class with no `!important` overrides every one. The demo's own inline `border: none`/`background: none` workarounds were deleted and it renders identically                                                                                                                                                                                                                                                                                                       |
| **S15**      | `KeyboardAction` (16 members) exported in place of `SideEffectAction` (18); `KeyToActionMap` uses it. `CHANGE_VALUE` and `AUDIO_FILE_ENDED` are no longer bindable. Verified in `dist/index.d.ts`: the unexported `type SliderComponent` declaration is gone, so the finding's second half — export it — became unnecessary rather than done                                                                                                                                                                                                                                                                                                                                             |
| **F12**      | `range === 0` guard in `getOffset`, matching `getProgress`. **Mutation-proven**: three rows fail when the guard is removed. Worse than the finding recorded — not only live streams but every player before `loadedmetadata`, since the duration is 0 then too, and the invalid `translate(calc(NaNpx - 50%))` made the browser drop the transform entirely                                                                                                                                                                                                                                                                                                                              |
| **C7**       | Both duplicates deleted rather than reconciled: `getClientXY` had no consumer in `src/` (its test was what kept it alive), and `sliderModes`'s `Orientation` was declared and never used. `positionOf` survives in `Slider/pointerPosition.ts` — a module of its own because it is the one DOM-coupled helper in the slider stack, and because the repointed tests are the only unit coverage of axis selection, jsdom's fixtures having `clientX === clientY`                                                                                                                                                                                                                           |
| **T5**       | The other half: the dead `useAudioElement` mock in `PlaybackRate.test.tsx` is gone, and `.Current`'s row asserts _visibility_ rather than presence — the component renders children in both branches, so `toBeInTheDocument()` could not tell them apart. The row also sets the element's rate, so its name is finally true                                                                                                                                                                                                                                                                                                                                                              |
| **T6**       | The arithmetic block is deleted rather than repaired, which was the finding's own verdict. The invariant it claimed to pin is pinned for real one layer up, in `useSlider.test.tsx`: five rows drive `onThumbPointerDown` against a stubbed thumb rect, where the subtraction is production's to make                                                                                                                                                                                                                                                                                                                                                                                    |
| **T7**       | 35 fixed `waitForTimeout` calls → 1. Three helpers in `test-utils.ts` (`waitForAudioField`, `waitForPlaying`, `waitForMuted`) wait on the element instead of on the clock. **Mutation-proven**: with `TOGGLE_PLAY` stubbed to a no-op, both `toggle-play` rows fail on a `waitForPlaying` timeout naming the line — the 100 ms sleep would have reported green. The one survivor is `no-snap-back`'s sampling cadence, which is deliberate and now says so. Side effect: several rows went 150 ms → 40 ms                                                                                                                                                                                |
| **T8**       | `toBeCloseTo(x, 0.25)` — ±0.281 by way of a fractional `numDigits` — became `SEEK_TOLERANCE_S = 0.3` through an `expectNear` helper that reports both numbers on failure, across 13 assertions. The inverse case in `drag-drop-time.spec.ts`, `toBeCloseTo(px, 1)` = ±0.05 px on a layout coordinate, is now `LAYOUT_TOLERANCE_PX = 1`                                                                                                                                                                                                                                                                                                                                                   |
| **T9**       | Both rate-button keyboard rows assert on the element rather than on a mock of `useHandleMediaKeys`, and the module-level `vi.spyOn` that disabled the real hook for _every_ test in those two files is gone. Each row presses `p` (expecting `play`) and `>` (expecting a 0.05 rate step — deliberately not the button's own `amount`)                                                                                                                                                                                                                                                                                                                                                   |
| **T10**      | `.not.toThrow()` in place of `toBeUndefined()` on a `void` function, matching `createPlayerStore.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **T11**      | The character-for-character duplicate in `calculateStyle.test.ts` is deleted. The rest was assessed and kept: on a second look the `rootStyles` rows are not change-detectors — they pin S8's rule that opinion lives in `styles.css`, which regresses the moment a property moves back inline                                                                                                                                                                                                                                                                                                                                                                                           |
| **Coverage** | The four named gaps are closed: `useTimeDisplay` (5 rows, the `Math.max(…, 0)` clamp approached from both directions), the `useSliderContext` / `usePlayerConfig` missing-provider throws (new `SliderContext.test.tsx`), `{ mode: "rate", step: 0 }` (continuity on a press _and_ the arrow-step fallback), and `Timeline.Progress`'s transition in **both** branches. The last two are **mutation-proven**: pinning the transition on unconditionally, and dropping the arrow-step fallback, each fail rows that did not exist before                                                                                                                                                  |

### Found during the work, not in the original review

|                                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Out-of-range media writes throw**     | `volume` outside [0, 1] raises `IndexSizeError`, `playbackRate` outside [0, 16] raises `NotSupportedError`, and a non-finite `currentTime` raises `TypeError` — all measured in Chrome. Unreachable while sliders were the only callers, and **made reachable by `useAudioPlayer`**, which hands `setVolume`/`setRate`/`seek` arbitrary input. Fixed with clamping guards on the write path; 9 tests, including the two `NaN`-before-metadata paths (`SET_TIME_TO_PERCENT`, `SET_TIME_FORWARD`) that would have thrown on a real element. |
| **`type-check` covered no config file** | `tsconfig.node.json` included only `vite.config.ts`, and the root `tsconfig.json`'s `types: ["node"]` does not reach referenced projects. `tsup.config.ts`, `vitest.config.ts` and `playwright.config.ts` were unchecked. Fixed.                                                                                                                                                                                                                                                                                                          |
| **A third `.Set`**                      | `PlaybackRate.Set` and `PlaybackRateSlider.Set` were different components one character apart. Resolved by S7.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **`.Track` was the wrong rename**       | The README already calls `.Background` "the track", so `.Track` would have moved the collision rather than removed it. `.Control` was taken instead.                                                                                                                                                                                                                                                                                                                                                                                      |
| **Fake fidelity**                       | `play()` now returns a promise and is typed as a spy, closing divergence #2 from the test review.                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### Still open

`BACKLOG.md` is authoritative. Codec fallback and buffered ranges have their own
sections there.

---

### Two gates, not one — refining A5/A7's predicate

A5/A7 shipped the right _mechanism_ (`aria-disabled`, activation blocked in the
hook) reading the wrong _predicate_: `loadState !== "ready"`, which conflated
"errored" with "still loading" and then applied both to every control.

**What the load-state check got wrong.**

- **Play was the worst case.** `play()` at `readyState: 0` is legal and the
  browser queues it, so suppressing the click dropped the first interaction most
  users attempt. And because changing `audioFile.src` re-enters loading, it
  recurred on **every playlist advance**, not only at startup. The accessible name
  already said "Loading audio" (A4), so `aria-disabled` was adding suppression,
  not information.
- **Volume and rate were collateral damage.** Neither reads `duration`; both write
  properties the element accepts at `readyState: 0`. They inherited a gate that
  was only ever about the timeline.
- **It missed a case entirely.** A live stream has `duration: Infinity` and a
  perfectly healthy `readyState`, so no load-state check reaches it — while the
  timeline's `maxValue` _is_ the duration, which is exactly A5's degenerate range.

**The split.** `useIsDisabled` becomes `loadState === "error"`. A new
`useIsSeekable` — `duration > 0`, modelled on `useIsBuffering`: same file, same
shape, derived rather than tracked, so there is no flag to get stuck on — gates
the two controls that have to name a position on the track, the timeline slider
and `SeekButton`.

**Three corrections to the decision as first written.**

1. **There is no central keydown guard to leave untouched.** `useHandleMediaKeys`
   reads no disabled state at all — the media keys already fire on a disabled
   control, deliberately, since they belong to the player and already fired from
   every other focused element in that state. The load-state suppression only ever
   covered clicks, via `useDisabledButtonProps`, and the sliders' own pointer and
   arrow handling. **The keyboard path needed nothing**, which makes the change
   smaller than it looked.
2. **`SeekButton` had to move too, not become ungated.** "Loading disables
   nothing" is right for Play, Mute, the two rate buttons and `Time.Toggle`, and
   wrong for `SeekButton`: `useSeek` sends `SET_TIME_FORWARD` whichever way
   `amount` points, so both directions read `el.duration`, and without one
   `writeTime`'s finite guard drops the write silently. Unlike `PlayButton` it has
   no name change to carry that. So it is gated on seekability — the same
   predicate as the timeline, for the same reason.
3. **`Infinity` never reaches the store, so the predicate is simpler than
   proposed.** `finite()` in `syncFromElement` maps every non-finite duration to 0
   at all three write sites, so a live stream arrives as `duration === 0` and a
   `Number.isFinite` conjunct would be dead code. `duration > 0` is complete, and
   the tests pin that coupling: remove `finite()` and the three `Infinity` rows
   fail, because `Infinity > 0`.

Also worth recording, since these documents are the project's memory: A5's own
text describes the **error** state, where `duration` is 0 too — so both predicates
fire there and A5 was satisfied either way. The loading and live-stream cases are
an extension of A5, not a reading of it.

**Mutation-proven in both directions.** Reverting `useIsDisabled` to
`loadState !== "ready"` fails 14 rows; removing `finite()` fails 11. `isSeekable`
is also added to `useAudioPlayer` and exported as `useIsSeekable`, since a
consumer building custom controls needs the same predicate — including the
live-stream subtlety, which they would otherwise have to rediscover.

**Known limit, not fixed here.** At the _action_ level the picture is finer than
one boolean: `SET_TIME_BACKWARD` (the `j` and `ArrowLeft` keys) never reads
`duration` and is well defined with no metadata at all, and on a live stream a
rewind is legitimate within `el.seekable`. Announcing a range for that needs
`el.seekable` projected, which is the deferred buffered-ranges work in
`BACKLOG.md` §3. A direction-aware gate was rejected as premature: it would add a
second predicate shape to serve a case the library cannot yet describe.

## Contents

1. [Accessibility](#1-accessibility)
2. [Public surface & DX](#2-public-surface--dx)
3. [Product / feature gaps](#3-product--feature-gaps)
4. [Architecture & style](#4-architecture--style)
5. [Tests](#5-tests)
6. [Performance](#6-performance)
7. [Cross-cutting](#cross-cutting-findings)
8. [Rejected claims](#rejected-claims)
9. [Suggested order](#suggested-order)

---

## 1. Accessibility

Audited live in Chromium: accessibility snapshot, real key presses, `MutationObserver` on
the aria surface, and Chrome's own AX tree via CDP `Accessibility.getFullAXTree`.

### P0

**A1. Space activates nothing — it starts playback instead.** 🔬
`src/KeyboardControls/handleMediaKeys.ts:21` maps `" "` to `TOGGLE_PLAY`, and `:66` calls
`preventDefault()`, suppressing native button activation. The handler is attached to every
control in the library. Observed: focus "Seek forward by 10 seconds", press Space →
`paused: true → false`, no seek. Enter still works (`"Enter"` is unmapped).
_WCAG 2.1.1 Keyboard (A); APG Button pattern._
Fix: skip the map for `" "` when the target is an activatable control, or drop `" "` from
the defaults — `p`/`k` already cover play/pause.

**A2. No modifier-key guard — VoiceOver navigation drives the player.** 🔬
`handleMediaKeys.ts:61` reads `keyToActionMap[event.key]` without checking
`ctrlKey`/`metaKey`/`altKey`. Observed with focus on Play:
`Control+Alt+ArrowRight` → `currentTime 0 → 5`; `Control+Alt+m` → muted;
`Control+p` → playback started, browser Print hijacked.
`Ctrl+Option` is the VoiceOver modifier, so every VO navigation command both fires a player
action and gets `preventDefault()`ed. _WCAG 2.1.1 (A)._
Fix: `if (event.ctrlKey || event.metaKey || event.altKey) return false;` at the top.
Note: WCAG 2.1.4 Character Key Shortcuts is **not** violated — shortcuts are focus-scoped.

**A3. The error alert hides its own message from AT.** ✅
`src/Player/ErrorMessage.tsx:14-21` puts `aria-hidden="true"` on the `<div>` holding
`{children}`, inside a `role="alert" aria-live="assertive"` with a hardcoded English
`aria-label`. A live region is announced from its _content_; all content is hidden, so the
region is empty. The consumer's message — the only customisable part — is the thing
suppressed. _WCAG 4.1.3 Status Messages (AA)._
Fix: drop both the `aria-hidden` wrapper and the `aria-label`.

### P1

**A4. Toggle buttons change name _and_ `aria-pressed`.** 🔬
`MuteButton.tsx:20-21`, `PlayButton.tsx:9-14,26-27`. After clicking Mute:
`aria-label="Unmute" aria-pressed="true"` → announced as "Unmute, toggle button, pressed",
which is self-contradictory. _WCAG 4.1.2 (A)._ `Time.Toggle` (`TimeDisplay.tsx:25-26`) does
it correctly — stable name, state on `aria-pressed`. Pick one channel.

**A5. Sliders are never disabled and expose a degenerate range.** 🔬
`SetSliderValue` has no disabled path. In the error state:
`aria-valuenow="0" aria-valuemin="0" aria-valuemax="0"`, no `disabled`, no `aria-disabled`.
Arrow keys are accepted and do nothing, silently. Use `aria-disabled="true"` so the tab stop
survives (this also fixes A7).

**A6. Home and End do nothing on any slider.** 🔬
`useSlider.ts:315-331` handles only `ARROW_KEYS`; everything else falls through to the
global map, where Home/End/PageUp/PageDown are unmapped. Home/End are **required** by the
APG Slider pattern. For the timeline there is currently no keyboard "jump to start/end"
except the undocumented `0` shortcut.

**A7. Focus is destroyed on load-state change.** 🔬
Native `disabled` removes the focused element from the tab order, dropping focus to
`<body>`. Observed on a mid-session `src` swap. _WCAG 2.4.3 (A)._ Fixed by the same
`aria-disabled` change as A5.

**A8. The volume slider does not reflect mute.** 🔬
After Mute: element `muted: true`, slider still `aria-valuenow="1" aria-valuetext="100%"`.
After 25 ArrowDowns: `{muted: true, volume: 0.05}` while announcing "5%".
`sliderModes.ts:56` derives the text from volume alone and never sees `muted`.

### P2

**A9. `aria-current` is the wrong property for rate options.** 📖
`SetPlaybackRate.tsx:27`. `aria-current` means "current item in a set of _navigational_
items". Mutually exclusive settings want a radio group or `aria-pressed`.

**A10. Nothing names or bounds the widget.** 🔬 `AudioPlayer.tsx:17-27` renders no DOM
element — no landmark, no `role="region"`, no name. With two players on a page the AX trees
are byte-identical. Shared library/consumer responsibility.

**A11. `role="group"` is inconsistent across the three sliders.** 🔬
`Timeline.tsx:71` group with **no name**; `Volume.tsx:42-43` group _with_ a name;
`PlaybackRateSlider.tsx:61-70` no role at all. An unnamed group is not useful. Name all
three or drop all three.

**A12. The time display reads as bare numbers.** 🔬
`TimeDisplay.tsx:57,59,74,80` — `aria-label` **replaces** the accessible name, so AT
announces "elapsed" rather than "0:00", and `role=time` is not surfaced by NVDA/JAWS. No
`Time.*` part accepts props, so a consumer cannot fix it. Mitigated by the timeline's good
`aria-valuetext`.

**A13. Float noise in `aria-valuenow`.** 🔬 `sliderModes.ts:55,66` use identity quantizers:
`aria-valuenow="0.8999999999999999"`, `"1.2000000000000002"`. Shielded by `aria-valuetext`
today, so low impact — but rounding costs nothing and `seek` already does it.

**A14. Prop-spread order can disable keyboard support.** ✅
`SetSliderValue.tsx:29-37` — `{...props}` lands after the handlers, `tabIndex` and every
`aria-value*`, but _before_ `role`. So the invariants that matter for operability are the
overridable ones. `DragButton.tsx:18-20` has the mirror problem with `tabIndex={-1}` and
`aria-hidden`.

**A15. Every string is hardcoded English.** 📖 Most `aria-label`s can be overridden via
props, but `aria-valuetext` is value-dependent (so a static prop cannot replace it) and
`ErrorMessage` accepts no props at all.

### Confirmed good — do not change

- **The 1 Hz quantisation works exactly as designed.** 🔬 `MutationObserver` over 4s of
  playback recorded 5 updates, `valuenow` and `valuetext` in lockstep. A keyboard seek
  reached the tree in 13 ms. **Not** a candidate for raising resolution.
- **Tab order is exactly 14 stops**, nothing extra, nothing mouse-only; all three drag
  thumbs genuinely absent from the AX tree (not merely `aria-hidden` in markup). 🔬
- **`aria-valuetext` is well chosen** — "Position 0:15 of 4:43", "95%", "1.2x".
- **Focus indicators**: the library ships no CSS and breaks no defaults — correct for a
  headless library.
- `<audio aria-label="audio player">` (`AudioElement.tsx:36`) is **inert** — without
  `controls` the element is `ignored: true, notRendered` in the AX tree. Harmless, but it
  reads like a deliberate decision and should be removed. 🔬

---

## 2. Public surface & DX

Verified by rendering `dist/index.mjs` through `react-dom/server`.

### P0

**S1. `className` is silently dropped on `<Timeline>` and `<Volume>` — while the types
accept it.** ✅ The single worst finding.
`Timeline.tsx:57-63` and `Volume.tsx:41-56` destructure `...props` and never spread it —
only `props.style` is read. Rendering `<Timeline className="my-track" id="tl" data-x="1"
onClick={fn}>` emits `<div role="group" style="...">` and nothing else.
`PlaybackRateSlider.tsx:69` **does** spread correctly, so the surface is inconsistent too.
Types promise `HTMLAttributes<HTMLDivElement>`, runtime discards it: no error, no warning,
a stylesheet that does nothing. Every Tailwind, CSS-Modules and styled-components user hits
this in the first ten minutes. Fix is one line each; non-breaking.

**S2. `Time` is a plain object typed as a component.** ✅
`TimeDisplay.tsx:92` is a **one-argument** `Object.assign`, which returns the object
unchanged. Confirmed: `typeof Time === "object"`, keys `['Elapsed','Remaining','Duration','Toggle']`.
`dist/index.d.ts` declares `type Time = React.FC<{children}> & {...}`, so `<Time>…</Time>`
type-checks and throws _"Element type is invalid… but got: object."_ The annotation is the
only reason it compiles. Every sibling compound casts a real root function; `Time` is the
only one with no root element. (Pre-existing — the Phase 5 `NamedExoticComponent → FC`
change preserved the existing lie rather than introducing it.)

**S3. No `"use client"` directive — breaks the Next.js App Router.** ✅ 0 hits in
`dist/index.mjs`. The library is entirely `useState`/`useEffect`/`useSyncExternalStore`, so
importing it from a Server Component throws at build time. Fix: `banner: { js: '"use client";' }`
in `tsup.config.ts`.

**S4. No `type="button"` — every button submits an enclosing form.** ✅ 0 hits in `src/`.
Worse, `PlayButton.tsx:7`, `SetSliderValue.tsx:8` and `DragButton.tsx:4` are typed
`React.HTMLAttributes<HTMLButtonElement>` rather than `ButtonHTMLAttributes`, so `type`,
`disabled`, `form`, `name` and `value` are all type errors — the consumer cannot patch it
without `@ts-expect-error`. `MuteButton` and `Seek` use the right type, so this is
inconsistent as well.

**S5. A consumer's `onKeyDown`/`onPointerDown` silently kills the slider.** ✅
`SetSliderValue.tsx:29-37`, `DragButton.tsx:17-21` — `{...props}` wins over the library
handlers. `<Timeline.Seek onKeyDown={analytics}>` removes arrow-key seeking and all media
shortcuts. Radix solves this by composing handlers unless `event.defaultPrevented`.
(Same defect as **A14**, from the DX side.)

**S6. `audioFiles` array shape + `AudioFile` missing `type`.** ✅ See **P1/P3** in
[Product](#3-product--feature-gaps). Listed P0 here because the _prop shape_ freezes on
publish.

**S7. `Timeline.Seek` is the wrong name and collides with the top-level `Seek`.** 📖
Two exports named "Seek": a slider track and a skip button. The three sliders don't even
agree — `Timeline.Seek` but `Volume.Set` and `PlaybackRateSlider.Set`, all the _same_
component. Suggested: rename all three to `.Track` (its own doc comment says "it measures
the track, since it **is** the track") and the top-level `Seek` → `SkipButton`. Breaking,
free now.

### P1

**S8. Inline styles mean `className` alone can never size anything.** 📖
Inline `style` beats any author-stylesheet selector regardless of specificity. Locked
properties by element:

| Element                               | Inline properties locked                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Timeline` root                       | `display, grid-template-*, width, height, position`                                              |
| `Volume` / `PlaybackRateSlider` roots | `display, grid-template-*, width`                                                                |
| `.Progress`                           | `grid-column, grid-row, width, height, transform, transform-origin` (+ `transition` on Timeline) |
| `.Seek` / `.Set`                      | the above **plus** `border, background, padding`                                                 |
| `.Drag`                               | `position, grid-column, grid-row, cursor, transform, touch-action`                               |

Tailwind `h-2 w-1/2 rounded-full bg-blue-500` on `Timeline.Progress` applies only the last
two. Tell: the demo (`App.tsx:52-140`) styles entirely with `style={{}}` and never once with
`className` — the library is only usable the way its author uses it.
Proposed split: keep _structural_ inline (`transform`, `grid-column/row: 1/1`,
`position: absolute` on Drag, `touch-action: none`); move _opinion_ out
(`width/height: 100%`, `border/background/padding` resets, `cursor: grab`, the new
`transition`) into an optional stylesheet with low-specificity selectors.

**S9. No `data-*` state attributes.** ✅ Only `data-testid` in the demo. Drag state lives
solely in the private `SliderContext`, so a consumer **cannot** style the dragging state
from CSS _or_ JS — no workaround exists. Everything needed is already computed by
`usePlayerState()` / `useVolumeState()`. Proposed: `data-orientation`, `data-state`,
`data-disabled` on the roots, track, thumb, `PlayButton`, `MuteButton`. Additive.

**S10. No escape hatch to the `<audio>` element.** ✅ `AudioElement` is not exported and
`AudioPlayer.tsx:23` renders `<AudioElement />` with no props and no children. Blocks:
`<track>` (captions), `preload`, `crossOrigin` (→ no Web Audio, no visualisers, no HLS.js),
multiple `<source>`, and any `ref`. Ironically `AudioElement.tsx:5-9` already accepts
`AudioHTMLAttributes` and children — fully built, simply unreachable.

**S11. `translate(calc(${offset}px - 20px), 0)` hardcodes a 40px thumb.** ✅
`calculateStyle.ts:24-28`. Every demo thumb is exactly 40×40. A 16px thumb is drawn 12px off
at every position. Fix: `- 50%`, which resolves against the element's own border box and
self-centres at any size.

**S12. Volume and PlaybackRateSlider roots lack `position: relative`.** ✅
`Timeline` gets it via `containerStyles`; `Volume.tsx:44-50` and
`PlaybackRateSlider.tsx:62-68` hand-inline a reduced set without it. `Drag` is
`position: absolute` with grid placement, which only applies when the grid container is its
containing block — so those two thumbs merely _happen_ to land nearby. Also: every slider
collapses to zero height unless the consumer sets one (the demo sets 40px on all three; the
README never mentions it), and `sliderLength` then measures 0 → silently dead slider.

**S13. No hook-level API.** ✅ `usePlayerState`, `useVolumeState`, `useIsDisabled`,
`useTimeDisplay` all exist in `src/store/derived.ts` and none reach `src/index.ts`.

**S14. Missing/mis-nested children fail silently.** 📖 Omitting `Timeline.Seek` leaves
geometry at `{0,0}`: thumb parks at `-20px`, clicks do nothing, no `role="slider"`, no aria,
no tab stop, **no warning**. Nesting `Timeline.Drag` inside `Timeline.Seek` produces
`<button>` inside `<button>`. Suggested: dev-only warnings, stripped in production.
_Good news:_ the existing context guards (`SliderContext.tsx:32-35`) have genuinely
excellent messages.

**S15. `SideEffectAction` is too broad for its one public use.** 📖 Exported only because
`KeyToActionMap` needs it, but the union includes `CHANGE_VALUE` (which references
`SliderComponent` — declared in `dist/index.d.ts:5` but **not exported**, so a consumer can
build the value but cannot name its type) and `AUDIO_FILE_ENDED`. Suggested: a narrower
`KeyboardAction`.

### P2

**S16. Three components accept no props and cannot be styled.** 📖 `ErrorMessage`
(children only, and hardcodes `className="audio-player-error"` — an undocumented global
class in a headless library); `Time.Elapsed/.Remaining/.Duration`; the `PlaybackRate` root.
Formatting is locked to `M:SS` with no `format` prop.

**S17. `PlaybackRate.Current` contradicts its own type.** 📖 Declared
`React.ReactElement | null` but the non-current branch returns
`<span style={{visibility:"hidden"}}>` (`SetPlaybackRate.tsx:49`), never `null` — it
occupies layout space, which the README doesn't hint at.

**S18. `react-dom` is an unnecessary peer dependency.** ✅ 0 references in the bundle.

**S19. React 19 untested.** 📖 No blocker found on inspection (the `AudioElement.tsx:28-30`
ref callback correctly returns `undefined`), but devDeps pin React 18 and there is no CI
matrix, so `>=18.0.0` is unverified.

### P3

**S20. CSS custom properties** (`--progress`, `--offset`) as an _addition_ to the computed
transform — enables gradient fills, conic dials, and `width` instead of `scaleX` (which
distorts `border-radius`). Keep the transform as the default.

**S21. `Volume`'s exported type has a duplicated intersection** (`dist/index.d.ts:203-213`),
an artifact of the `Object.assign(X as Y, {...})` pattern. Harmless, but it's the first
thing a consumer sees in their editor.

**S22. `Progress` stacks above `Background` by accident** — `Progress` carries a
`transform`, creating a stacking context. Silently inverts if a consumer overrides
`transform` (exactly what S20 invites). Give `Background` an explicit `z-index`.

**S23. Packaging is otherwise clean.** ✅ `attw` green for node16-from-ESM and bundler;
`exports` ordered correctly; `sideEffects: false` accurate. Nits: `version: 0.0.0`, no
`engines`, CJS `require()` fails with an opaque error and wants a documented ESM-only note.

### Biggest documentation gap

**There is no styling section.** For a library whose first listed feature is "🎨 Style the
components any way you want", the README never mentions inline styles, never mentions that
`className` is dropped on two roots, shows no `style`/`className` example, and never states
that a slider root needs an explicit height or it silently measures zero. A consumer's first
attempt — `<Timeline className="h-2 bg-gray-200">` — produces an invisible, unstyled,
zero-height element with no error.

---

## 3. Product / feature gaps

### P0

**F1. No way to read player state.** ✅ `src/index.ts` exports components and three types —
no hook, and `AudioPlayerProps` has no `onPlay`/`onPause`/`onEnded`/`onTimeUpdate`/`onError`
and no `ref`. A consumer cannot render "2:14 / 5:03" in their own header, log analytics, or
react to a track finishing. The only escape hatch in the library is
`customKeyboardShortcuts`, which is write-only.
This also makes the README's own advice impossible: `README.md:152-154` says to "gate any UI
that needs a length on a duration greater than zero" — `duration` is unreachable.
Smallest fix: one `useAudioPlayer()` hook. `readable()` already strips `set`, so the
projection invariant survives. ~15 lines.

**F2. `audioFiles` is an array that ignores index 1+.** ✅
`AudioElement.tsx:11` — `const { src } = audioFiles?.[0] || {};` is the only read. No
iteration, no `currentIndex`, no `NEXT_TRACK`. The plural name and array type promise a
playlist and deliver one track. Deferring the _feature_ is right; shipping the _array-shaped
prop_ ahead of it is what freezes the mistake.
Also: `audioFiles={[]}` type-checks, renders `<audio>` with no `src`, and disables every
control permanently with no error.
Fix: either rename to `audioFile: AudioFile` (singular) or ship the minimum playlist.

**F3. `AudioFile` is `{src}` and the README example does not compile.** ✅ **Confirmed by
running `tsc`:**

```
error TS2353: Object literal may only specify known properties,
and 'type' does not exist in type 'AudioFile'.
```

`README.md:65` shows `{ src: "audio.mp3", type: "audio/mpeg" }`. **This is the second false
README claim of the same class as the captions one** — copy-pasting the documented
`<AudioPlayer>` example fails to build. Consequences: no codec fallback, and no Media
Session metadata (`title`, `artist`, `artwork`).

**F4. `play()` rejection is dropped.** ✅ `handleSideEffect.ts:21,30` call bare
`audioElement.play()` — no `.catch`. Two common paths: **autoplay blocked**
(`NotAllowedError`, every mobile browser) gives an uncaught rejection and no signal, so the
UI cannot render "tap to play"; and **`AbortError`** on any rapid `TOGGLE_PLAY` — a
double-click or a held `p` key. The store's write-only invariant means the `.catch` cannot
set an atom directly; `SideEffectContext` is the sanctioned channel.

### P1

**F5. No buffering state at all.** 📖 `HANDLERS` has no `waiting`, `playing`, `stalled`,
`progress` or `canplay` row; `SyncableMediaElement` has no `buffered`/`seekable`/
`networkState`. The trap is worse than a missing spinner: `loadState` flips to `"ready"` at
`readyState >= 1` (HAVE_METADATA), so a player with metadata and zero audio data reports
`"playing"`. Mid-track rebuffering is invisible.
P1-and-pre-1.0 because `PlayerState` is a union consumers will switch on exhaustively —
adding `"buffering"` later is breaking.
Architecture makes this **easy**: `HANDLERS` is a table you add rows to.

**F6. Media Session API entirely absent.** ✅ 0 hits for `mediaSession`. For an _audio_
library this is the most visible platform integration there is — lock screen, OS media keys,
car head units. `SideEffectAction` already maps almost 1:1 onto `setActionHandler`. Blocked
by F3 (no metadata fields to publish).

### P2

**F7. `ended` is unobservable and actively erased.** 📖 `AudioElement.tsx:44` rewinds to 0;
`usePlayerState` has no `"ended"` member. After a track finishes the UI is byte-identical to
"never started" — no replay affordance, no autoplay-next, no completion analytics. The
rewind is correct — the refactor plan set it out, and `AudioElement`'s `onEnded`
handler is where it lives; the fix is an additive atom.

**F8. `MediaError.code` is thrown away.** ✅ `syncFromElement.ts:142-144` collapses the
error to `loadState = "error"` and never reads `el.error`, so consumers cannot distinguish
`MEDIA_ERR_NETWORK` (retry) from `MEDIA_ERR_SRC_NOT_SUPPORTED` (don't).

**F9. Element config unreachable** — `crossOrigin`, `preload`, `loop`, `autoPlay`. ✅
Same root cause as S10. `crossOrigin` is the sharp one: it blocks every Web Audio visualiser
with no workaround. `loop` has no action at all and is roadmapped.

**F10. Keyboard shortcuts only fire when a library button has focus.** 📖 The default map is
`space`, `j`/`k`/`l`, `0`-`9`, `<`/`>` — unmistakably YouTube's _global_ vocabulary, so
readers will assume page-wide. Suggested: a `keyTarget="document"` prop.

### P3

**F11. No persistence** of volume, rate or position. Strongest argument for doing F1 first —
with a hook, consumers build this in ten lines and it need never be a library feature.

**F12. `getOffset` lacks the `range === 0` guard its sibling has.** 📖
`sharedFunctions.ts:120-121` computes `(0-0)/0` for a live stream and hands
`translate(calc(NaN px - 20px))` to the thumb. `getProgress` guards this;
`getOffset` doesn't.

---

## 4. Architecture & style

### P1

**C1. Rate-slider bounds live in three places and disagree.** 📖 ✅(partial)
`PlaybackRateSlider.tsx:49-57` (props default 0.5/4), `useSlider.ts:114-116` (mode defaults),
`handleSideEffect.ts:97-106` (clamps 0.5/4). With `<PlaybackRateSlider maxValue={2}>`, the
arrow-key path clamps at **4**, so arrow-up past 2 pushes the element beyond the track while
the thumb pins and `aria-valuenow` keeps climbing. Volume and seek don't have this — their
clamps match their maxima by construction.

**C2. `SLIDER_MODES.mutesAtZero` does not control mute-at-zero.** 📖
Its two uses (`useSlider.ts:237-241,264-268`) only unmute-on-grab and pin the memory. The
actual zero rule is keyed off `action.component === "volume"` in
`handleSideEffect.ts:60-70`. So "is this the volume slider?" is answered twice, in two
layers, and the mode table — whose stated purpose is one discriminant in one place — is only
half the answer. Either move the rule up, or rename the flag to `unmutesOnGrab`.

**C3. `valueFromStoreRef` + its effect mirror a value the store gives free.** ✅
`useSlider.ts:130-133` is the textbook "mirror rendered state into a ref via an effect"
smell, and here it's strictly _staler_ than the alternative: `commit` runs from a window
`pointerup` listener that can land before React flushes passive effects. Atoms expose
`get()`. Deletes a ref, an effect, and a staleness window at zero cost.

**C4. The mode discriminant is re-derived by hand six times.** ✅
`useSlider.ts:96-116`, immediately above the `config` resolved for the purpose. Two live
consequences: `store.duration` is subscribed **unconditionally**, so every volume and rate
slider re-renders on `durationchange` for a value it never uses; and the `mode === "seek"`
branch silently discards a caller's `maxValue`, which `UseSliderOptions` advertises for all
modes.

**C5. The ResizeObserver effect binds a node it can never re-bind.** ✅
`useSlider.ts:135-169`. Deps are `[measure]`; the node comes from a ref, which cannot trigger
a re-run. If the semantic node is remounted (`{expanded && <Timeline.Seek/>}`, or a changed
`key`), the observer stays attached to a detached node forever and the slider never
re-measures. The fix is the pattern used one file over — `AudioElement.tsx:18-23` holds the
node in `useState` for exactly this reason.

**C6. `Time` is typed as a component and is not one.** ✅ Same as **S2**.

### P2

**C7. `positionOf` duplicates `getClientXY` byte-for-byte.** ✅
`useSlider.ts:57-64` vs `sharedFunctions.ts:132-142`. `getClientXY` and `PositionEvent` now
have **zero callers in `src/`** — only the test file imports them. So there is a
tested-but-dead export and an untested live duplicate of it. Separately, `Orientation` is
declared twice (`sharedFunctions.ts:1` and `sliderModes.ts:6`), with different files
importing different copies.

**C8. `ChangePlaybackRate` subscribes to read once, and bypasses the clamp.** ✅
`ChangePlaybackRate.tsx:39-45` subscribes to `rate` only to supply a value at click time, so
every `ratechange` re-renders the button; `store.rate.get()` in the closure does the same
with no subscription. And `SET_PLAYBACK_RATE` is **unclamped**
(`handleSideEffect.ts:78-81`), so `<PlaybackRate.Change>` walks past 4 while the `>` key and
the slider arrows stop at 4 — same value, two policies.
Note: the comment justifying the subscription describes the _pre-refactor_ hazard; `.get()`
in a handler is neither a render read nor a subscription.

**C9. The drag effect registers `touchcancel` but not `touchend`.** 📖
`useSlider.ts:334-384` — while the press-wait block in `onTrackPointerDown` registers
`touchend`. Probably covered by `pointerup` on modern browsers, but the asymmetry between
the two listener sets is unexplained.

### P3

**C10. `getProgress` takes `sliderLength` and never uses it arithmetically.** 📖
`calculateStyle.ts:52-66` — it's a proxy for "not measured yet". Reasonable, but the
signature promises a pixel computation and returns a fraction.

### `useEffect` inventory — 7 total, 6 in library code

| #   | Location                                  | Legitimate?                    | Deps honest?                    | Cleanup            | StrictMode         | Removable?                           |
| --- | ----------------------------------------- | ------------------------------ | ------------------------------- | ------------------ | ------------------ | ------------------------------------ |
| 1   | `useSlider.ts:131-133`                    | **No** — state-into-ref mirror | yes                             | n/a                | safe               | **Yes** — use `atom.get()` (C3)      |
| 2   | `useSlider.ts:163-169` ResizeObserver     | yes                            | **No** — reads undeclarable ref | correct            | safe               | No, but must re-key on the node (C5) |
| 3   | `useSlider.ts:191-195` clears `committed` | **No** — sets state from state | yes                             | n/a                | safe (converges)   | **Yes** — render-phase adjustment    |
| 4   | `useSlider.ts:250` release pin on unmount | yes                            | yes                             | is the cleanup     | safe               | No                                   |
| 5   | `useSlider.ts:334-384` drag listeners     | yes                            | yes                             | correct, symmetric | safe               | No — but see C9                      |
| 6   | `AudioElement.tsx:20-23` store attach     | yes                            | yes                             | correct            | **safe by design** | No — model effect                    |
| 7   | `App.tsx:178-186` (demo) `popstate`       | yes                            | yes                             | correct            | safe               | No                                   |

**No effect leaks a listener and none double-fires destructively under StrictMode.**
Two are state-sync in disguise; one has an unfixable-as-written dep array.

### Confirmed good

`src/store/*` — no divergence from the stated invariants found. `set` handles genuinely stay
in the closure; `syncFromElement` reads no atom (the one exception, `pinned`, is in the
signature as the plan specifies); `HANDLERS` is a real table with a `satisfies` clause that
makes a typo a build error; derivations are pure with no cache; `holdAudibleVolume` is
counted **and** idempotent per release.
`useSlider` at 413 lines is one cohesive behaviour, not bloat — splitting it is what the
refactor undid.

---

## 5. Tests

Both suites were run: **337/337 jsdom, 51/51 E2E green.** The jsdom tier is genuinely
strong and does what the refactor plan's testing strategy promised. **The E2E tier does not hold up its
half of the bargain.**

### P0

**T1. `no-snap-back.spec.ts` cannot detect a snap-back.** ✅
The single most important E2E spec — named after the one invariant only a real media
element can exercise — asserts on the **element**, not the UI:

```ts
// no-snap-back.spec.ts:63,82 → sampleCurrentTime() → getTimelineState()
currentTime: audio?.currentTime ?? 0,   // test-utils.ts:30
```

The snap-back is a **UI** bug: after commit, display falls through to the `currentTime`
atom, which holds the pre-seek value until `seeked` echoes (~250 ms). The **element** never
snaps back — `el.currentTime = 40` is synchronous and stays 40.
Delete the entire retain-until-changed rule (`useSlider.ts:121-124,184-189,191-195,224-230`)
and **both rows still pass**, while the thumb and `aria-valuenow` visibly flick back to 0.
This is **the one finding where a real, user-visible bug can ship green.**
Fix: sample `aria-valuenow`, or better the thumb's `boundingBox().x`, which moves at 4 Hz
and sees the whole transient.

**T2. The `progressbar` assertion is vacuous.** ✅
`progress-indicator.spec.ts:48-57` queries `[role="progressbar"]`, which exists nowhere in
the codebase → `null` → `0/1 = 0` vs an expected ratio of ~0.0005, under a 0.281 tolerance.
Passes unconditionally.

**T3. "progress indicator updates on audio playback" does not test that it updates.** 🔬
Same file, `:44-46`. Plays for 100 ms so `currentTime ≈ 0.1`; `aria-valuenow` is
`Math.floor`-quantised to `0`; `|0 − 0.1| < 0.281` passes. **Freeze `aria-valuenow` at 0
permanently and this still passes.** Also latently flaky the other way on a slow machine.

### P1

**T4. `retries: 2` is unconditional, and the comment says otherwise.** ✅
`playwright.config.ts:16-17` — the comment reads "Retry on CI only" but the value is not
guarded (contrast `forbidOnly: !!process.env.CI` two lines above). With `workers: 1`, a
flaky row retries silently and reports green. The plan makes E2E a **blocking CI gate**, so
this converts "intermittently broken" into "passing".

**T5. `CurrentIndicator` "renders with current rate" cannot fail.** 🔬
`PlaybackRate.test.tsx:56-64` asserts `toBeInTheDocument()`, but `CurrentIndicator` renders
children in **both** branches (`SetPlaybackRate.tsx:41-50` — the non-current branch is a
`visibility: hidden` span). The element's rate is actually `1`, so the component is in the
_not_-current branch while the test name claims otherwise.
Root cause: a **stale mock** of `useAudioElement`, a module deleted in `f006e51`. ✅
Confirmed the module no longer exists. `AudioPlayer.test.tsx:82-84` has the same dead mock
of `useHandleSideEffect`. ✅

**T6. The "grab-offset composition" block is arithmetic, not a test.** 🔬
`sharedFunctions.test.tsx:243-300` performs the subtraction under test _in the test_, on two
numbers it derived from the same variable: `(60 + g) − g === 60` by construction. No
production path decides anything. Its docstring claims it pins an invariant it does not pin.
The real coverage is elsewhere and is good.

**T7. Fixed `waitForTimeout` as the only synchronisation** — 30+ calls. Worst:
`toggle-play.spec.ts:27-37` waits 100 ms then reads `!audio.paused`; `play()` resolves
asynchronously and decode start is unbounded — a real race on a loaded CI box. It also does
`await expect(isPlaying).toBe(true)` on a plain boolean, which does **not** retry.
The suite already contains the right pattern (`ended.spec.ts:35-39`, `multi-instance.spec.ts:49-53`
use `waitForFunction` with an explicit predicate).

**T8. `toBeCloseTo(x, 0.25)` — 14 assertions with a fractional `numDigits`**, giving a
±0.281 tolerance. Assessed individually: most are _thin but fine_ (±0.28 s on a seek to an
exact target still catches a wrong step or direction) and should simply be rewritten as
`toBeLessThan(0.3)` so the number reads as what it is. Two are vacuous (T2, T3).
Opposite problem: `drag-drop-time.spec.ts:78,84,86` uses `toBeCloseTo(px, 1)` = **±0.05 px**
on a layout coordinate — a flake waiting to happen.

### P2

**T9. Two rate-button tests assert on the mock, not the element.** 🔬
`ChangePlaybackRate.test.tsx:64-70`, `SetPlaybackRate.test.tsx:65-71` verify wiring only —
they would pass if `handleMediaKeys` did nothing. The module-level `vi.spyOn` in `beforeEach`
also disables the real hook for _every_ test in those files. Neighbouring files
(`PlayButton.test.tsx:66-78`) do it correctly against the fake.

**T10. `handleSideEffect` null guard asserts nothing.** 🔬
`handleSideEffects.test.ts:29-32` — `expect(result).toBeUndefined()` where the function
returns `void` on every path. `createPlayerStore.test.ts:129-133` shows the right shape
(`.not.toThrow()`).

**T11. Change-detector tests.** `calculateStyle.test.ts:163-191` asserts constants equal
themselves; `:83-95` is a character-for-character duplicate of `:70-81`; four
`"should export all subcomponents"` rows assert `toBeDefined()` on statically-typed
properties. Thin but harmless — only the duplicate is worth deleting.

### Coverage gaps

| Gap                                                            | Note                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `useTimeDisplay` has **no unit test**                          | The only derivation missing from `derived.test.tsx`; the `Math.max(duration − currentSecond, 0)` clamp is untested at any tier             |
| `useSliderContext` / `usePlayerConfig` missing-provider throws | `SliderContext.test.tsx` was deleted in `f006e51` with no replacement                                                                      |
| **`Timeline.Progress`'s CSS transition**                       | `Timeline.test.tsx:37-44` omits `transition` from its `toHaveStyle` list, so **neither branch of the new Phase 4 deliverable is asserted** |
| `{ mode: "rate", step: 0 }`                                    | Continuity with `step: 0` is covered in volume and seek mode, not rate — see below                                                         |
| `positionOf`'s orientation branch                              | jsdom fixtures set `clientX === clientY`, so axis selection is **E2E-only**                                                                |
| Autoplay / `play()` rejection, buffering, `seeking`            | Nowhere — code gap _and_ coverage gap (see F4, F5)                                                                                         |

### The nine deleted tests: nothing real was lost — with one caveat

Eight covered actions that no longer exist. The ninth, `"stays continuous on DRAG when step
is 0"`, pinned a real bug. **Verdict: the behaviour is now structurally unrepresentable** —
`useSlider.ts:197-209` builds one `valueAt` closure that both the track press and the drag
call, so click/drag divergence is no longer expressible, and `step = stepOption ?? 0` has no
`||` fallback. Continuity with `step === 0` **is** asserted at `useSlider.test.tsx:286-305`
(volume mode) and `:220-232` (seek mode). **Not covered:** no row uses
`{ mode: "rate", step: 0 }`, which is exactly the original bug's mode. One `it.each` row
closes it.

### Mutation analysis — do the load-bearing tests fail correctly?

18 invariants traced. **15 fail correctly**, several with strong E2E backing
(`mute.spec.ts`, `error-recovery.spec.ts`, `ended.spec.ts`, `volume-drag.spec.ts`).
**3 do not:** T1 (survives deleting the retain rule), T6 (no mutation affects it), and
vertical _axis selection_ (jsdom fixtures make `clientX === clientY`; caught only by E2E —
legitimate, but worth knowing).

### Fake fidelity (`testJSDom/store/mediaElementFake.ts`)

Divergences that could let a bug through, worst first:

1. **`duration: 100` with `readyState: 0`** — unreachable on a real element, where `duration`
   is `NaN` before metadata. Consequence: **no component test ever renders a slider with
   `duration === 0`**, the real loading state. The fake actively hides it.
2. **`play()` returns `undefined`, not a Promise** — so autoplay rejection and `AbortError`
   are unmodelled in the fake _and_ unhandled in the source (F4).
3. Setting `currentTime` / `volume` fires nothing — tests emit by hand. This is what makes
   the retain window observable in jsdom, so it is a _feature_; the cost is that real timing
   is only observable in E2E, where T1 means it isn't observed.
4. **A second, divergent fake** exists at `testJSDom/setup.ts:136-192`, patching
   `HTMLMediaElement.prototype` globally with different defaults and no `readyState`/`error`.
   Two fakes with different semantics is a maintenance trap; `custom-render.tsx` appears to
   have no importers left.

### Confirmed strong

`syncFromElement.test.ts` (539 lines, one row per event, plus a `HANDLERS`-completeness
check typed as `SyncEvent[]` so a typo is a build error) and `useSlider.test.tsx` (547 lines,
every mode × gesture, drag-cancel, all four pin-release paths) are the two best files here.
`createPlayerStore.test.ts:81-125` covering StrictMode double-attach, the detach→attach gap
and element swap is exactly the right paranoia.

---

## 6. Performance

Measured against a **production** build (`esbuild --minify --define:process.env.NODE_ENV='"production"'`)
served outside the repo, using CDP `Performance.getMetrics` deltas (immune to timer
clamping, so they survive throttling), `Emulation.setCPUThrottlingRate`, and an instrumented
copy of `atom.ts` counting per-atom sets/wakes/notifications.

**The Phase 5 verdict survives production and throttling. No memoization and no rAF
coalescing is warranted anywhere.** One large new finding.

### P1

**P1-a. Tree-shaking is broken — importing only `<PlayButton>` costs 66 % of the library.** 🔬 + ✅
The most valuable performance finding. Rollup 4.44, `dist/index.mjs` as shipped, React
external, minified + gzipped:

| consumer imports           | gzip        | share of full bundle |
| -------------------------- | ----------- | -------------------- |
| everything                 | 6,139 B     | 100 %                |
| **`PlayButton` only**      | **4,025 B** | **66 %**             |
| `Time` only                | 3,821 B     | 62 %                 |
| `Timeline` + `AudioPlayer` | 5,187 B     | 84 %                 |

✅ **Independently corroborated.** I bundled the shipped `dist` with esbuild and grepped the
`PlayButton`-only output: `"Playback rate slider"`, `"Volume slider"`, `"Timeline slider"`,
`"Toggle elapsed"` and `ResizeObserver` are **all still present**. A consumer importing one
button ships the entire slider engine.

_Cause 1 — `Object.assign(X, {...})` is an un-droppable side-effecting call._ Three sites:
`Volume.tsx:65`, `PlaybackRateSlider.tsx:84`, `TimeDisplay.tsx:92`.
**The codebase already contains the working pattern** — `Timeline.tsx:91-94`,
`PlaybackRate.tsx:16-19`, `PlayButton.tsx:82-83` and `MuteButton.tsx:73-75` use plain
property assignment and **do** shake away cleanly.
Measured fix (three one-line changes, no runtime/type/API change):
**PlayButton-only 4,025 B → 1,125 B gzip, −72 %.** 🔬

_Cause 2 — `sideEffects: false` is inert as configured._ `package.json:28` sets it, but
`tsup.config.ts` has `splitting: false` with a single entry, so `dist/` is **one module** —
and `sideEffects` operates at _module_ granularity. Measured: a multi-module build takes
PlayButton-only to **1,092 B**. Either fix alone lands at ~1.1 KB.

**P1-b. A volume/rate drag costs 2.4× a seek drag — the mode Phase 5 never traced.** 🔬
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

### P2

**P2-a. The 250 ms transition is correctly composited, but promotes 4 unrelated elements to
their own layers.** 🔬
Good news, all measured: compositing reason is `ActiveTransformAnimation` (runs on the
compositor, `LayoutCount` = 0); **0 `transitioncancel`** over 8 s (inter-start gap ~256 ms vs
250 ms duration — the figure is well chosen); no re-rasterisation blur; CPU cost
**≈ 2.5 ms/s = 0.25 % of wall clock**.

New finding — **GPU memory**: layers 5 → **10**, texture **78.3 → 83.4 MB**. The 4 extra
promotions are `Overlap`-driven and include **both Volume slider buttons** — an unrelated
part of the UI. Because a transition starts every 256 ms, these layers persist for all of
playback. ~5 MB of GPU texture for a 250 ms cosmetic ease.
**`will-change: transform` is contraindicated** — it would make the transient 5 MB permanent
and buys nothing, since the transition is already composited.

### Measured and confirmed as noise — do not act

| Concern                                     | Measurement                                                                                                               | Verdict                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Layout thrash in the drag path**          | **0 `getBoundingClientRect` calls during 300 moves** on all three sliders; CDP `LayoutCount` per move = 0.000 at 1×/4×/6× | **Clean — confirmed with numbers, not inspection.** The path reads only React state    |
| Per-render allocation                       | ~1.85 µs/move = **0.95 %** of the 0.195 ms move cost; 1,600 B/move, inside one scavenge                                   | Noise. The Phase 5 decision not to memo `SliderContext` now has a number behind it     |
| `Object.is` bail-out                        | Discards **28 of 38** `currentSecond` writes (74 %); `muted` takes **201 sets / 0 wakes** per volume drag                 | Works, and earns more on the hot path than on the clock                                |
| `timeupdate` waking extra components        | **0 writes** to `volume`/`muted`/`rate`/`paused`/`loadState`/`duration` during playback                                   | Correctly insulated                                                                    |
| Window listeners                            | **5 added at pointerdown, 0 added/removed across 300 renders, 5 removed at end**                                          | The Phase 5 `useCallback` carve-out is proven under render churn                       |
| `duration` subscribed in all modes (**C4**) | 1 wake at mount, 2 per `src` swap, **0** during playback or drag                                                          | **2 wasted renders per media load.** Negligible — do not restructure the hook for this |
| `prime()` on `emptied`/`loadstart`          | 18 atom writes, 5 wakes, 66 notifications — once per load                                                                 | Closed                                                                                 |
| `formatTime` per tick                       | 180 ns; 0.05 ms/s during a drag                                                                                           | Invisible                                                                              |

**Subscription census:** 72 `useSyncExternalStore` subscriptions for one fully-composed
player, **0 unsubscribes after mount** — no churn, no leak.

### The dev-build caveat, answered

| build                  | Debug panel | ms/move   |
| ---------------------- | ----------- | --------- |
| dev (vite, StrictMode) | yes         | 0.881     |
| production             | no          | **0.283** |

**Phase 5's numbers overstate the shipped cost by 3.1×.** Note the throttle rates calibrate
non-linearly (nominal 4×/6× measured as effective 5.4×/10.2×), so the figures above are
**pessimistic**, not optimistic.

### Not measured

Real hardware (all throttling is Chrome emulation on one laptop); coalesced touch input
(all drags were synthetic, i.e. the uncoalesced worst case); mount/first-paint cost;
webpack as consumer bundler (Rollup and esbuild only); non-Chromium compositing.

---

## Cross-cutting findings

Reported independently by two or three reviews each — the strongest signal on the list:

| Finding                                                  | Reported by                                                                | Severity  |
| -------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| `Time` is not callable                                   | Architecture (C6), Public surface (S2)                                     | **P0**    |
| `audioFiles` ignores index 1+                            | Product (F2), Public surface (S6)                                          | **P0**    |
| `AudioFile` missing `type`; README example fails `tsc`   | Product (F3), Public surface (S6)                                          | **P0**    |
| Slider prop-spread order overrides handlers & aria       | A11y (A14), Public surface (S5)                                            | **P0**    |
| No `<audio>` escape hatch / no state hook                | Product (F1, F9), Public surface (S10, S13)                                | **P0/P1** |
| `useSlider.ts:96-110` subscribes to the same atom twice  | Architecture (C4), Performance (P1-b)                                      | **P1**    |
| `Object.assign` compound pattern                         | Public surface (S21, cosmetic), **Performance (P1-a, 66 % of the bundle)** | **P1**    |
| Hardcoded English strings, `ErrorMessage` takes no props | A11y (A15), Public surface (S16)                                           | **P1/P2** |

### Two reviews reached opposite conclusions — reconciled

**`store.duration` subscribed in all slider modes** (`useSlider.ts:112`). Architecture (C4)
flagged it as a live consequence: "every volume and rate slider re-renders on
`durationchange`". Performance **measured** it: 1 wake at mount, 2 per `src` swap, **0 during
playback or any drag** — two wasted renders per media load.
**Resolution: fix it as part of C4's tidy-up if you touch that code, not for performance.**
The architecture point (the discriminant is re-derived six times next to the table built to
hold it) stands on its own; the performance justification does not.

**The `Object.assign` compound pattern.** The public-surface review noted it only as a
cosmetic type-duplication nit (S21). Performance found it is the primary cause of a **66 %
tree-shaking failure** (P1-a). Same code, and the performance framing is the one that
matters — three one-line changes for a 72 % reduction in what a single-component consumer
ships.

---

## Rejected claims

**❌ "A volume track click never updates `lastAudibleVolume`."** (Architecture, orig. #7)

Claimed that because the audible-volume pin is taken on pointer-down and released on
pointer-up, the click's own queued `volumechange` lands while pinned and is skipped — so
unmuting restores a stale value. It further claimed the passing jsdom test
(`useSlider.test.tsx:529-537`) papers over this with an unrealistic event order, and
proposed moving the hold into `beginDrag`.

Reproduced in Chrome against the running demo:

```
after click 70%   {"volume":0.7,"muted":false}
after click 0%    {"volume":0,"muted":true}
after unmute      {"volume":0.7,"muted":false}   ← correct
```

The reasoning does not hold in a real browser. **Disregard — it proposed changing working
code and "correcting" a test that is right.**

---

## Suggested order

**Best value per line changed, do these first** — all non-breaking, all one-liners:

| Change                                                        | Payoff                                            |
| ------------------------------------------------------------- | ------------------------------------------------- |
| **P1-a** — three `Object.assign` → property assignment        | Single-component import **4.0 KB → 1.1 KB gzip**  |
| **S1** — spread `{...props}` on two roots                     | `className` starts working at all                 |
| **S3** — `banner: '"use client"'`                             | Unblocks the Next.js App Router                   |
| **A2** — `if (ctrlKey \|\| metaKey \|\| altKey) return false` | Unbreaks VoiceOver                                |
| **T1** — sample `aria-valuenow`, not `audio.currentTime`      | The one test that would let a real bug ship green |

**1. Remaining ship-blockers, cheapest first** — non-breaking:
A1 (Space) · A3 (error alert) · S4 (`type="button"` + widen three prop types) · S2 (`Time`) ·
S5/A14 (compose handlers) · S11 (`- 50%`) · F4 (`play().catch`) · T2/T3 (vacuous assertions) ·
T4 (`retries: process.env.CI ? 2 : 0`)

**2. Breaking reshapes, while they are still free:**
F2/F3 (`audioFiles` + `AudioFile`) · S7 (`.Track` / `SkipButton` renames) · S8 (styling
split) · F5 (`PlayerState` gains `"buffering"`) · S15 (`KeyboardAction`) · A5/A7
(`aria-disabled`) · A4 (toggle naming)

**3. Additive wins:**
F1 (`useAudioPlayer()`) · S10/F9 (`audioProps` + `audioRef` — also unblocks captions) ·
S9 (`data-*`) · A6 (Home/End) · A8 (mute in volume text) · F6 (Media Session) · F8
(`MediaError.code`) · S20 (CSS variables)

**4. Test repairs** beyond T1–T4:
T5 (assert visibility, delete two dead `vi.mock`s) · a `useTimeDisplay` clamp test ·
a `useSliderContext` missing-provider row · one `{ mode: "rate", step: 0 }` row ·
**a `transition` assertion on `Timeline.Progress`** (the Phase 4 deliverable is currently
untested in both branches) · delete T6

**5. Internal cleanup, no consumer impact:**
C3 · C5 · C4 (+ the duplicate subscription, P1-b) · C7 · C8 · C1 · C2 · effects #1 and #3

**6. Decide consciously:** the transition's 5 MB of GPU layers (P2-a). Keeping it is
defensible — but **do not add `will-change`**.

**7. Documentation** — the README styling section (S8/S12) is worth more to adoption than
any three code changes on this list.

---

## Method

Six independent reviews, run in parallel, each given the refactor plan for context and told
to judge the code against its own stated invariants, to engage with deliberate trade-offs
(the 1 Hz aria quantisation, no live-stream support, no rAF coalescing) rather than
rediscover them, and not to pad. All six were read-only.

Every claim in this document was either executed by the reviewing agent with its output
shown, or independently re-verified afterwards. Claims marked 📖 are the exception: plausible
code readings that were not re-checked. One claim was reproduced in a browser and
**disproven** — see [Rejected claims](#rejected-claims).
