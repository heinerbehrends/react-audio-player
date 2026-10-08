# Pre-beta review: architecture, public API and missing features

2026-10-08. A read of the whole library before `0.1.0-beta.0`, focused on the
public surface and on what a consumer will miss. The build, export check,
bundle budgets, doc check and ticket index all passed at the start of the
review, so the package was publishable as it stood; what follows is what to
settle while the API is still cheap to change.

## Verdict

The architecture is sound and ready for a beta. The `<audio>` element is the
single source of truth, the store's atoms are read-only outside it, `send` is
the only write path, and swaps, errors and play intent are corroborated
against the element rather than trusted from events. Server rendering and
server components are handled: the `"use client"` banner, server snapshots on
every `useSyncExternalStore`, guarded `navigator` and `document`.
Tree-shaking is structural and guarded in CI. The ticket history had already
caught the categories a reviewer usually finds, and the open tickets at review
time (F10, F15, T13) were correctly judged non-blocking.

The findings are five API-shape points and two feature gaps. Each is additive
or a rename today and breaking after the first publish.

## Findings

### 1. Two vocabularies for one set of operations — S36

The hook offers `play`, `pause`, `toggle`, `seek`, `seekBy`, `setVolume`,
`toggleMute` and `setRate`. The shortcut map offers sixteen actions in a
different vocabulary, and the two do not cover the same ground: a key can
stop, unmute, jump to a percentage and step the rate; the hook cannot. The
hook can set an absolute volume or position; a key cannot. Because
`KeyboardAction` is public through `customKeyboardShortcuts`, 1.0 freezes the
internal action names forever.

**Decided:** consolidate on one list of verbs, with the shortcut map taking
the same functions as the hook. The player is a client component, so the data
form's one advantage, crossing a server-component boundary, is moot. Twelve
verbs cover every default shortcut and every example button; `seekToFraction`
was considered and withdrawn, since no common button jumps to a percentage.
Ticket **S36** carries the proposal, the three behaviours the factory must
keep, and the test churn.

### 2. Resuming a position does not work the obvious way

`docs/custom-ui.md` lists "resuming where the listener left off" as a hooks
use case, and F11 refused persistence on the grounds that it is ten lines. The
natural ten lines, `seek(saved)` in an effect, do nothing: the timeline write
in `handleSideEffect` is gated on a known duration, and the `seek` doc comment
says only that the browser clamps. Nothing tells the consumer to wait for
`useIsSeekable()`.

More broadly there is no initial-state story. `muted` and `autoPlay` reach the
element through `audioProps`, but volume, rate and position are properties,
not attributes. A `startTime` on `AudioFile`, applied at `loadedmetadata`, is
the smallest fix and is also what a playlist with saved positions needs.
Short of that, document the gate and the `src#t=120` media fragment, which
browsers honour natively.

### 3. The captions recipe does not do what it says

`docs/recipes/audio-element.md` and the README guide table say captions are
added by passing a `<track>` child. On an `<audio>` element the browser loads
the cues and exposes them through `textTracks`, but renders nothing; the
recipe as written produces an invisible track. The roadmap already lists
captions as future work, so the fix before beta is a sentence saying so. The
feature itself is a `useActiveCues()` hook: the same sorted-list-plus-position
pattern the podcast example uses for chapters, and the answer to the
transcript-sync half of D6.

### 4. `useAudioPlayer()` is all or nothing

It subscribes to eight atoms. A component that reads only `play` re-renders on
every `volumechange` sample during a drag and every rate step. The position
was excluded for exactly this reason, and volume during a drag is the
next-noisiest signal; the playlist example's `Player` already pays this cost
for one method. An additive `useAudioControls()` with zero subscriptions fixes
the common case now. Per-field hooks for `paused`, `volume`, `rate` and
`duration`, or a selector argument, can come after the beta.

### 5. Names to settle before they freeze

- `audioFile` names something that can be a live stream and carries artist,
  album and artwork. `track` matches `onPreviousTrack` and `onNextTrack`,
  which already use the word.
- `customKeyboardShortcuts` sits beside `labels`. `shortcuts`, with the type
  renamed to match, reads as one family. S36 replaces the type anyway.
- The three sliders share every part and the same `useSlider`, which accepts
  `orientation`, `step`, `minValue` and `maxValue`. `Timeline` exposes only
  `step`, `Volume` only `orientation`. The gaps read as oversights; either
  expose the set on all three or say in each doc comment why not. (The rate
  slider's `minValue` / `maxValue` are gone with F15, by design.)

### 6. A `reload()` control

The errors guide, the live-stream guide and the live example all reach for
`audioRef.current.load()` to retry. It is the documented recovery path for a
`"network"` error and for a dropped stream, and the only reason the live
example needs `audioRef` at all. One method on the controls removes that. It
folds into S36's verb list.

### 7. Doc accuracy on `seek`

The comment on `AudioPlayerControls.seek` should state the seekable gate,
whatever is decided on finding 2.

## Code review of the commits since the last review

`ccb8e87..0caf39c`, sixteen commits: refs on every part, the buffer bar,
chapters, the volume-drag fix, the docs split and the two new examples. Read
at the commit, not the working tree. No runtime bugs in `src/`; the findings
are a check that does not check, a promise the code does not keep, tests that
cannot fail, and example and doc drift.

### Before beta

1. **`check-docs` skips the members of six compound parts.** The member loop
   runs only on a line matching `declare const X: {`. `Timeline`, `Volume`,
   `PlaybackRate`, `PlaybackRateSlider`, `PlayButton` and `MuteButton` are
   typed through an alias (`declare const Timeline: TimelineComponent;`), so
   `.Progress`, `.Control`, `.Thumb`, `.Background`, `.Playing`, `.Paused`,
   `.Muted`, `.LowVolume`, `.HighVolume`, `.Set`, `.Change`, `.Current` and
   `.Display` go unchecked, and have no JSDoc at HEAD. This is the failure B10
   was opened for. Members of exported types such as `PlayerLabels` are not
   checked either.
2. **A button's `type` can be overridden.** Every button hook builds
   `{ type: "button", …, ...props, ...composed }`, so `<PlayButton
type="submit">` is a submit button and submits an enclosing form on every
   press. `docs/your-own-buttons.md` and the `ButtonBagBase.type` comment say
   it is always `"button"`. Move `type` into `composed`.
3. **The custom-components example loses its shortcuts on a slider.** The
   scrubber and the volume slider are native `<input type="range">`, and the
   key handler skips every `INPUT`. After a click on the timeline, `k`, `m`,
   `f`, `d` and `1`–`3` do nothing. The handler should skip text entry only;
   a range input takes no characters. The panel's "K oder Leertaste" is also
   wrong: Space plays only while the root itself has focus.
4. **Two tests cannot fail.**
   - `testE2E/Player/buffering.spec.ts`: the stall moved from 2 s to 8 s, but
     the closing assertion is still `currentTime > 2.5`, true before the rest
     of the file arrives. Assert past the stall point.
   - `testJSDom/Shared/refs.test.tsx`, "Timeline.Control keeps measuring with
     a ref of the caller's": `aria-valuemax` comes from the store. If
     `useMergedRef` dropped `setSliderRef` the slider would go inert and the
     test would pass. Seek with a pointer against a mocked
     `getBoundingClientRect` instead.

### Before beta, smaller

5. **A chapter click before metadata plays from 0:00.** The podcast example
   calls `seek(start); play()`, and the seek is dropped while the duration is
   unknown. Likely on iOS, where `preload` defaults to `none`. The same gate as
   finding 2; the example should wait for `useIsSeekable()` or disable the
   chapter list until then.
6. **The podcast example has no end card.** README's guide table and
   `docs/recipes/chapters.md` both promise one. Add it with `useIsAtEnd`, or
   drop the claim.
7. **`TimeToggle` in custom-components builds its text from `formatTime` and
   its name from `labels.time`.** They agree only because the German entry
   wraps `formatTime`; change one and the accessible name no longer contains
   the visible text (WCAG 2.5.3). The `useTimeToggleProps` comment advises
   rendering `Time.Elapsed` / `Time.Remaining` inside instead.
8. **The custom-components scrubber.** `aria-valuetext` reads `time`, not
   `dragged ?? time`, so it lags during a drag; and `dragged` is cleared only
   on pointerup, keyup and blur, so a `pointercancel` freezes the thumb.
9. **`p: null` unbinds lowercase `p` only.** `docs/keyboard.md` shows it, but
   the default map binds `P` too. Say so, or match keys case-insensitively;
   S36 is the moment to choose.
10. **JSDoc that disagrees with the code.**
    - `Timeline`'s `step`: arrow keys add `step` to the position, they do not
      snap to a multiple of it. At 3.7 s with `step={5}`, ArrowRight goes to
      8.7 s.
    - `useTimeDisplay`: `remaining` is `duration - currentSecond`, fractional,
      not whole seconds.
    - `timelineValue` and `SliderAriaState`: `maxValue` is the raw duration,
      not whole seconds; only `value` is floored.

### Low

- `TimelineBuffered` keeps its last fraction when the element detaches; the
  effect returns without clearing `end`.
- Stale comments: `shortcuts.ts` says "the arrows seek 5 seconds", but Up and
  Down change the volume; `examples/playlist/src/App.tsx:70` still describes
  the removed `aria-labelledby` naming.
- Behaviour changes, not bugs: the volume and rate thumbs now follow the store
  during a drag, so a drag before the `<audio>` attaches no longer moves them;
  the slider layers' z-indexes rose by one (fill 2, thumb 3), which can
  restack a consumer's own layer.

Checked and sound: `@__PURE__` and pure `Object.assign` on every new
`forwardRef` part, with the ref after the spread; `useMergedRef` stability;
the slider refactor's default bounds; the synchronous volume and rate
projection in `send`; every docs link and anchor; the props, labels, keyboard
map and `AudioError` union as the docs show them; CI step order; the
bundle-size leak probes; and ten `src/` files whose diffs are comment-only.

## Code review of F15, uncommitted

All five findings below are fixed. On 5: the other rows run 2–14 % headroom,
so 12 % was not out of line; the two rows are now at 5–6 %.

Read 2026-10-08 against HEAD, staged and unstaged. The design holds: one atom,
read by the slider and clamped to by the write path, so the two cannot
disagree. The jsdom suite passes (442 tests in the twenty affected files) and
`tsc` is clean.

1. **Narrowing the range leaves the current rate outside it.**
   `setRateRange` replaces the atom and writes nothing. At 3x, a change to
   `[0.5, 2]` keeps playing at 3x; the slider reports `aria-valuenow` 3 against
   `aria-valuemax` 2 with its thumb pinned to the end, until the next rate
   write pulls it in. Clamp the element's rate in `setRateRange` when it falls
   outside, through `send` so the projection follows.
2. **The prop change is untested.** "follows a later change to the range"
   calls `store.setRateRange` directly; nothing re-renders `<AudioPlayer>`
   with a new `rateRange`, so the provider's effect is not exercised.
3. **The provider's effect overrides an injected store.** With `store` and no
   `rateRange`, the mount effect resets the store to the default. The
   harnesses now pass both, which is why the rate tests pass; the next harness
   that injects a store will lose its range silently. Skip the effect when a
   store is injected, or document the pairing on the `store` prop.
4. **`rateRange?: [number, number]` rejects a readonly tuple.** `const RANGE =
[0.5, 2] as const` does not type-check against it, though every internal
   signature already takes `readonly [number, number]`. Make the prop
   readonly.
5. **The budget rose 500 B for 125 B.** "AudioPlayer only" went from 2600 to
   3100 for a measured 2701 B, and the MediaSession row from 3700 to 4100.
   The first row had 24 B of headroom before; it now has about 400 B, enough
   to hide the next accidental pull-in. Set the ceilings at the measured size
   plus the usual margin. S36's "little headroom" line goes stale otherwise.

Also checked: a collapsed range (`[2, 2]`, or an inverted one, which
normalises to it) gives a zero span, which `getFraction` already guards; the
`<` `>` and `[` `]` steps and Backspace all go through `writeRate`; no write
to `playbackRate` remains outside `handleSideEffect`; README, CHANGELOG,
`docs/keyboard.md` and `docs/custom-ui.md` no longer mention the slider's
`minValue` / `maxValue` or `0.125`–`8` as the step limits.

S36, untracked: its verb list is twelve and omits `reload`, while finding 6
and the checklist below fold `reload` into it. Make the ticket thirteen.

## Decided during the review

- **F15 shipped (2026-10-08).** One `rateRange` per player on `<AudioPlayer>`,
  `[0.5, 4]` by default; every rate write clamps to it and the slider spans it.
  The slider's own `minValue` / `maxValue`, the bounds on the step actions and
  the "never against your own direction" rule are gone, since two ranges that
  could disagree were the only reason for them. Buttons and keys now stop at 4
  by default rather than 8. The "AudioPlayer only" budget was raised from
  2600 to 2900 B for it; measured 2741 B.
- **S36 opened** for the vocabulary consolidation, with the decision recorded,
  and resolved the same day; the ticket records what was decided while
  building it.
- **Renamed (finding 5):** `audioFile` to `track`, the `AudioFile` type to
  `Track`, and `customKeyboardShortcuts` to `shortcuts`. `KeyToActionMap`
  keeps its name until S36 replaces it. No aliases: nothing is published.

## Before tagging beta.0

1. Fix the captions sentence in the recipe and the README table (finding 3).
2. Add `startTime` or the media-fragment recipe (finding 2). The seek gate is
   documented on `seek` now (finding 7).
3. Renames in finding 5: `track` and `shortcuts` done. Slider prop parity
   still open.
4. ~~Land S36~~ — done: thirteen verbs with `reload`, function shortcuts that
   match letters in either case, and `useAudioControls()` (findings 1, 4, 6
   and code-review 9).
5. ~~Add `useAudioControls()`~~ — done with S36.
6. Fix the "Before beta" items of the code review: the `check-docs` member
   gap, the button `type`, the custom-components shortcuts, and the two tests
   that cannot fail.
7. ~~Before committing F15~~ — done: the five F15 findings below are fixed.

## After the beta

A captions hook (finding 3), per-field or selector hooks (finding 4), page-wide
shortcuts (F10), and the Safari pass (T13), which should precede 1.0 rather
than the beta.

## Checked and found sound

Listed so the next review need not repeat them: the store's write path and
projection; `playWanted` intent tracking across swaps; error latching
corroborated against `readyState`; the `"use client"` banner and server
snapshots; per-part string tables, `@__PURE__` on every `forwardRef`, and the
bundle budgets; ESM-only packaging with `attw`, `sideEffects: false` and types
for React 18 and 19; the one-state-channel-per-control accessibility model and
`aria-disabled` over `disabled`; one store per `<AudioPlayer>` with no shared
registry.
