# Backlog

Deferred work, with the reasoning for deferring it. Findings live in
`REVIEW-FINDINGS.md`; this file is what was consciously postponed and why.

**This is the only file that says what is still open.** `REVIEW-FINDINGS.md` is
the evidence archive — what was found, and how each fix was proven. When a
finding is resolved: add a row to that file's resolved table, and strike it
through here. A ref that is struck through here and absent from that table, or
present there and un-struck here, is drift.

The package is still unpublished (`version: 0.0.0`), so anything marked
**breaking** is free until the first `npm publish` and expensive after it. That
is the deadline to weigh every item against.

---

## 1. Codec fallback via `<source>` — **breaking, deferred**

Support several encodings of one track (`.opus` with an `.mp3` fallback), which
is what `<audio>` with multiple `<source>` children is for.

**Shape.** A list at the _source_ level, not the track level — this is not the
`audioFiles` playlist array that was removed, which was a collection of
different tracks:

```ts
export type AudioSource = { src: string; type?: string };
export type AudioFile = AudioSource | { sources: AudioSource[] };
```

**Why it is deferred, and it is not the type.** `<source>` children change the
reload contract the store is built on.

Today, changing `audioFile.src` updates the `src` **attribute**, the browser
re-runs resource selection unprompted, and fires `emptied` → `loadstart` — the
two rows at `src/store/syncFromElement.ts:151-152` that call `prime()` and
re-read every atom. **The whole track-swap story, including the shipped
`onEnded` playlist, rides on that automatic cycle.**

`<source>` children do not participate. Per the HTML resource selection
algorithm, mutating them after it has run has no effect until `el.load()` is
called explicitly. So in sources mode a playlist advance would render new DOM
and **silently keep playing the old track** — no error, no event.

**What implementing it requires:**

- An effect calling `el.load()` when the source list changes, **keyed on
  serialised content, not identity** — the documented usage passes an inline
  literal, so an identity-keyed effect is a reload loop. (Same hazard already
  documented on `PlayerConfigProvider`.)
- Reworking the error path: with `src` a failure is one `error` on the element;
  with `<source>` each child errors and the element only fails once all have,
  with different `MediaError` timing. `testE2E/Player/error-recovery.spec.ts`
  and the `loadState` machine both assume the `src` path.
- **E2E-only coverage.** jsdom has no resource selection whatsoever, so none of
  this is testable in the unit tier. Needs real multi-format fixtures —
  `public/` currently holds one `.mp3`.
- Documenting that `<source>` must precede `<track>` in the children order.

**Verdict:** worth doing, and the type shape is right, but it is a second
resource-loading mode with its own reload and error semantics touching the most
load-bearing part of the store. It gets its own change and its own tests, not a
fold-in. Note that `audioFile` would have to become omittable in sources mode,
since a present `src` attribute makes the browser ignore `<source>` children
entirely.

---

## 2. Deferred from the pre-1.0 review

Cross-references are to `REVIEW-FINDINGS.md`.

### Breaking — decide before publish

| Ref         | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S7**      | ~~Slider member and `Seek` naming~~ — **done**: `.Seek`/`.Set` → `.Control`, `.Drag` → `.Thumb`, top-level `Seek` → `SeekButton`. `.Track` was rejected because the README already calls `.Background` the track. `PlaybackRate.Set`/`.Change` and `Time.Toggle` keep verb names deliberately — a button is named by what it does.                                                                                                                                                                                        |
| **S8**      | ~~Split the inline styles~~ — **done**: opinion moved to an optional `styles.css`, exported as `react-headless-audio-player/styles.css`. Narrower than the finding proposed: `width/height: 100%` on the layers and the control is _not_ opinion, since `scaleX()` and the track measurement are relative to it. Moved: the button reset, `cursor: grab`, and the root's `width`. The roots gained `data-part="root"` to give the sheet a selector.                                                                       |
| **S15**     | ~~Narrow the exported `SideEffectAction`~~ — **done**: `KeyboardAction` is exported and `SideEffectAction` is not. `SliderComponent` was **not** exported as the finding suggested — narrowing removed the only public reference to it, so it dropped out of `dist/index.d.ts` on its own. Deleting the dangling reference beat widening the surface to legitimise it.                                                                                                                                                    |
| **A9**      | `aria-current` on the rate options is the wrong property — it means "current item in a set of _navigational_ items". Mutually exclusive settings want a radio group or `aria-pressed`. Breaking because a radio group changes the roles consumers query, and because `aria-pressed` is the channel A4 just removed from the toggles: decide whether "one of a set" is a different case from "on or off".                                                                                                                  |
| **A11**     | `role="group"` is inconsistent across the three sliders — `Timeline` has one with no name, `Volume` has one with a name, `PlaybackRateSlider` has none. An unnamed group is not useful. Name all three or drop all three; either way the AX tree changes shape.                                                                                                                                                                                                                                                           |
| **A12**     | The time display announces "elapsed" rather than "0:00": `aria-label` _replaces_ the accessible name, and no `Time.*` part accepts props, so a consumer cannot fix it. Fixing it means both a new prop surface on the `Time` parts and a change to what every existing player announces. Partly mitigated today by the timeline's `aria-valuetext`.                                                                                                                                                                       |
| **S16**     | `ErrorMessage`, the three `Time` display parts and the `PlaybackRate` root accept no props. `ErrorMessage` also hardcodes `className="audio-player-error"` — an undocumented global class in a headless library, and removing it is the breaking half. Time formatting is locked to `M:SS` with no `format` prop.                                                                                                                                                                                                         |
| **S17**     | `PlaybackRate.Current` is declared `React.ReactElement \| null` but never returns `null`: the non-current branch returns a `visibility: hidden` span that still occupies layout. Either outcome is breaking — returning `null` reflows, and keeping the span means correcting the type and documenting the reserved space.                                                                                                                                                                                                |
| **A4**      | ~~Toggle buttons change name _and_ `aria-pressed`~~ — **done**: the name is the only state channel on all three toggles. `aria-pressed` is gone from `PlayButton`, `MuteButton` and `Time.Toggle`, and `Time.Toggle` gained a changing name ("Show time elapsed" / "Show time remaining") to match. The name reaches further than a boolean: `PlayButton` also announces `loading` and `error`.                                                                                                                           |
| **A5 / A7** | ~~`aria-disabled` instead of native `disabled`~~ — **done**: the six gated buttons and all three sliders. `useDisabledButtonProps` also blocks activation, which the browser used to do, the consumer's own `onClick` included. A disabled slider ignores its arrow keys without letting them fall through to the global map, where `ArrowRight` seeks. The global shortcuts stay live on a disabled control, deliberately — they belong to the player, and already fired from every other focused element in that state. |

### Additive

| Ref             | Item                                                                                                                                                                                                                                                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**          | ~~No way to read player state~~ — **done**: `useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsBuffering` and `useAudioError` are exported.                                                                                                                                                                                                                             |
| **F5**          | ~~Stall signal~~ — **done**: `readyState` is projected and `useIsBuffering()` derives from it. Buffered _ranges_ remain, see section 3.                                                                                                                                                                                                                                            |
| **F6**          | Media Session API. The metadata fields on `AudioFile` were added ahead of this so it is not a breaking change when it lands.                                                                                                                                                                                                                                                       |
| **S9** _(part)_ | Still open: the **state** attributes `data-state` (idle/dragging, playing/paused, muted/low/high), `data-orientation` and `data-disabled`. Drag state remains unreachable from CSS _and_ JS.                                                                                                                                                                                       |
| **A6**          | ~~Home / End on the sliders~~ — **done**: both jump through `commit`, so the seek slider does not snap back. Slider-scoped deliberately — everywhere else the two keys stay the browser's.                                                                                                                                                                                         |
| **A8**          | ~~The volume slider announces "100%" while muted~~ — **done**: `aria-valuetext` composes the two ("Muted, 80%"). `aria-valuenow` is left alone, since it is the volume and muting does not move the thumb.                                                                                                                                                                         |
| **A10**         | Nothing names or bounds the widget: `AudioPlayer` renders no element, so there is no landmark, no `role="region"` and no name. With two players on a page the AX trees are byte-identical. Shared responsibility — the library can offer the wrapper, the consumer has to name it.                                                                                                 |
| **A15**         | Every string is hardcoded English. Most `aria-label`s can be overridden by prop, but `aria-valuetext` is value-dependent so a static prop cannot replace it, and `ErrorMessage` takes no props at all (see **S16**). Wants a formatter surface, not a string bag.                                                                                                                  |
| **F10**         | The shortcuts fire only when a library control has focus, but the default map (`j`/`k`/`l`, `0`–`9`, `<`/`>`) is YouTube's _global_ vocabulary, so readers assume page-wide. Suggested: a `keyTarget="document"` prop. Deferred because a document-level listener is the library reaching outside its own DOM, and needs an opt-in story for two players on a page.                |
| **F11**         | No persistence of volume, rate or position. Deliberately left out: with the hooks from **F1** shipped, a consumer builds this in ten lines, and a library that owns storage has to own the key naming and the SSR story too.                                                                                                                                                       |
| **S14**         | Missing or mis-nested children fail silently. Omit `.Control` and the geometry stays at `{0, 0}`: no `role="slider"`, no aria, no tab stop, clicks do nothing, no warning. Nest `.Thumb` inside `.Control` and you get a `<button>` inside a `<button>`. Wants dev-only warnings, stripped in production. The existing `SliderContext` provider guards show the standard to match. |
| **S22**         | `Progress` stacks above `Background` only by accident — its `transform` creates a stacking context. A consumer who overrides `transform` (which **S20** invites) silently inverts them. Fix: an explicit `z-index` on `Background`.                                                                                                                                                |
| **S20**         | CSS custom properties (`--progress`, `--offset`) alongside the computed transform.                                                                                                                                                                                                                                                                                                 |

### Internal, no consumer impact

| Ref             | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1**          | ~~Rate-slider bounds live in three places and disagree~~ — **done**: `RATE_BOUNDS` is the one default, and a slider with a narrower range sends its own bounds with the action. The global `<`/`>` keys keep the library range, having no slider to ask. `PlaybackRate.Change` still clamps to neither — that is the open half of C8.                                                                                                                                                                                                                                                                                      |
| **C2**          | `SLIDER_MODES.mutesAtZero` does not gate mute-at-zero; the real rule is keyed off `action.component` in another layer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **C3**          | `valueFromStoreRef` + its effect mirror a value `atom.get()` returns directly, and more freshly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **C4 / P1-b**   | The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **C5**          | The `ResizeObserver` effect binds a node it can never re-bind — hold it in `useState` like `AudioElement` does.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **C7**          | `positionOf` duplicates the now-dead `getClientXY`; `Orientation` is declared twice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **C8** _(part)_ | The 0.5–4 playback-rate policy is applied inconsistently: the slider arrows and the `>` key clamp there, `SET_PLAYBACK_RATE` does not. The write path now clamps to the browser's [0, 16] so nothing throws, but the library's own range is still unenforced — deliberately, since `<PlaybackRate.Set rate={8}>` names an explicit rate. Decide whether that is the intended contract.                                                                                                                                                                                                                                     |
| **F12**         | ~~`getOffset` lacks the `range === 0` guard its sibling has~~ — **done**: the guard sets `progress`, not an early return, because vertical counts from the top and its minimum is the full track length.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **A13**         | Float noise in `aria-valuenow`: the volume and rate modes use identity quantizers, so the value announces as `0.8999999999999999`. Shielded by `aria-valuetext` today, which is why it is not urgent — but rounding costs nothing and `seek` already does it.                                                                                                                                                                                                                                                                                                                                                              |
| **C10**         | `getProgress` takes `sliderLength` and never uses it arithmetically — it is a proxy for "not measured yet". Reasonable behaviour, misleading signature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **S21**         | `Volume`'s exported type carries a duplicated intersection in `dist/index.d.ts`, an artifact of the old `Object.assign(X as Y, {…})` pattern. Harmless, but it is the first thing a consumer sees in their editor.                                                                                                                                                                                                                                                                                                                                                                                                         |
| **P2-a**        | The 250 ms progress transition is correctly composited — measured: compositor-run, `LayoutCount` 0, zero `transitioncancel` over 8 s, ≈0.25 % of wall clock. The cost is GPU memory: layers 5 → 10, texture 78.3 → 83.4 MB, and the 4 extra promotions are `Overlap`-driven and include both Volume slider buttons, an unrelated part of the UI. A transition starts every ~256 ms, so those layers persist for all of playback. Recorded rather than actioned; **`will-change: transform` is contraindicated** — it would make the transient 5 MB permanent and buys nothing, since the transition is already composited. |
| **C9**          | The drag effect registers `touchcancel` but not `touchend`, while the press-wait block registers `touchend`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Tests

| Ref         | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T1**      | ~~`no-snap-back.spec.ts` samples `audio.currentTime`, but the element never snaps back — the UI does~~ — **done**, and mutation-proven: both rows fail when the retain-until-changed rule is deleted.                                                                                                                                                                                                                                                                                                                                                                                                            |
| **T2 / T3** | ~~Vacuous assertions in `progress-indicator.spec.ts`~~ — **done**: the fill is selected by `data-part="progress"`, and T3 plays until `aria-valuenow` moves before comparing like for like.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **T4**      | ~~`retries: 2` is unconditional~~ — **done**: `process.env.CI ? 2 : 0`, matching the idiom `forbidOnly` and `reuseExistingServer` already use. The `volume-state` flake recorded here is still unexplained — it never reproduced in 8 repeats — but **T7** removed its most plausible cause, an 80 ms sleep in that file's seed helper. If it recurs, that is now new information rather than the same open question.                                                                                                                                                                                            |
| **T5**      | ~~One dead `vi.mock` call remains: `PlaybackRate.test.tsx:10` mocks the deleted `useAudioElement`~~ — **done**, and the `.Current` row it was propping up asserts visibility rather than presence, so its name is now true.                                                                                                                                                                                                                                                                                                                                                                                      |
| **T7**      | ~~30+ fixed `waitForTimeout` calls as the only synchronisation~~ — **done**: 35 → 1, via `waitForAudioField` / `waitForPlaying` / `waitForMuted` in `test-utils.ts`, and mutation-proven on the row the finding named. The survivor is `no-snap-back`'s sampling cadence, which is a cadence rather than a wait and is commented as such. **Note for T4's open question:** `volume-state`'s seed was an 80 ms sleep before an indicator assertion, the most plausible cause of the flake T4 recorded. It now waits on `volume` and `muted`. Not proven — the flake never reproduced — but the mechanism is gone. |
| **T8**      | ~~A fractional `numDigits` in `toBeCloseTo(x, 0.25)`~~ — **done**: 13 sites, not 14 — one of the counted rows was T2's and had already been deleted. All now go through `expectNear` against a named `SEEK_TOLERANCE_S = 0.3`, which reports both numbers on failure. The inverse case is fixed too: `LAYOUT_TOLERANCE_PX = 1` where ±0.05 px sat on a laid-out coordinate.                                                                                                                                                                                                                                      |
| **T9**      | ~~Two rate-button tests assert on the mock rather than the element~~ — **done**: both press real keys against the fake, and the module-level `vi.spyOn` that disabled the hook for every test in those two files is gone.                                                                                                                                                                                                                                                                                                                                                                                        |
| **T6**      | ~~The "grab-offset composition" block is arithmetic, not a test~~ — **done**: deleted rather than repaired, the finding's own verdict. The invariant is pinned for real in `useSlider.test.tsx`, where `onThumbPointerDown` gets a stubbed thumb rect and production does the subtraction.                                                                                                                                                                                                                                                                                                                       |
| **T10**     | ~~`toBeUndefined()` on a function that returns `void` on every path~~ — **done**: `.not.toThrow()`, the shape `createPlayerStore.test.ts` already used.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **T11**     | ~~Change-detector tests in `calculateStyle.test.ts`~~ — **done** to the extent the finding asked: the duplicate is deleted. The `rootStyles` rows stay, and on a second look they are not change-detectors — they pin S8's rule that opinion lives in `styles.css`, which regresses the moment a property moves back inline. The `toBeDefined()` export rows stay too, as harmless.                                                                                                                                                                                                                              |
| —           | ~~No test asserts the `Timeline.Progress` CSS transition~~ — **done**: both branches, plus a row for the consumer override that spreading `props.style` last exists to allow. **Mutation-proven**: pinning the transition on unconditionally fails the drag row.                                                                                                                                                                                                                                                                                                                                                 |
| —           | ~~Missing: a `useTimeDisplay` clamp test, a `useSliderContext` missing-provider row, a `{ mode: "rate", step: 0 }` row~~ — **done**: all three, plus `usePlayerConfig`'s throw in the same new `SliderContext.test.tsx`. The rate/step-0 pair covers both halves — continuity on a press, and the arrow-step fallback, the second mutation-proven.                                                                                                                                                                                                                                                               |

### Packaging

| Ref     | Item                                                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S18** | `react-dom` is an unnecessary peer dependency — zero references in the bundle.                                                                                                                                       |
| **S23** | Packaging is otherwise clean — `attw` green, `exports` ordered, `sideEffects: false` accurate. The nits: no `engines` field, and `require()` fails with an opaque error where a documented ESM-only note would help. |
| **S19** | React 19 is untested; devDeps pin 18 and there is no CI matrix, so `>=18.0.0` is unverified.                                                                                                                         |
| —       | Extend `type-check` to cover `tsconfig.node.json` as well as `tsconfig.app.json`; the config files were unchecked until now.                                                                                         |
| —       | `version` is still `0.0.0`; npm rejects that as a release version.                                                                                                                                                   |

---

## 3. Buffered ranges — additive, deferred

The second half of F5. The stall signal shipped (`useIsBuffering()`); this is
the _other_ thing called buffering — how much of the track is downloaded, for
the lighter bar behind the progress bar.

**Shape.** `el.buffered` is a live `TimeRanges` object, and atoms hold
primitives so the `Object.is` bail-out works. So project a number:

```ts
bufferedEnd: Atom<number>; // end of the range containing currentTime
```

Updated from `progress`, `timeupdate` and `seeked`. Needs `buffered` added to
`SyncableMediaElement` — the first new field that interface has needed here,
since the stall signal reused `readyState`, which was already present. Then a
`<Timeline.Buffered>` part styled like `TimelineProgress`.

**Explicitly not modelling every range.** After seeking around, `buffered` holds
several disjoint ranges. An array atom would take a new identity on every
`progress` event, so `Object.is` would never bail and every subscriber would
wake several times a second — the exact hazard the store exists to avoid.
Serialising or custom equality would work but is not worth it: **`audioRef`
already ships**, so anyone needing full `TimeRanges` can read `el.buffered`
directly. That is what the escape hatch is for.

**Testing.** jsdom has no networking, so the projection is unit-testable against
the fake but real buffering is E2E-only, and triggering it deterministically
needs CDP network throttling. Expect thin coverage.

---

## 4. Considered and rejected

**A projected `ended` atom.** Rejected in favour of the `onEnded` callback.
`AudioElement` rewinds the element on `ended`, which clears `el.ended` within a
tick, so an atom would flicker — and advancing a playlist wants the edge, not
the level. A `hasEnded` flag that survived the rewind would be derived policy
state rather than a projection, breaking the store's central invariant that
`syncFromElement` is the only writer.

**"A volume track click never updates `lastAudibleVolume`."** Reported by the
architecture review; reproduced in Chrome and **disproven** — unmuting after a
click to zero correctly restores the pre-click volume. See the Rejected claims
section of `REVIEW-FINDINGS.md`.
