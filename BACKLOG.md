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

Sections 1 to 4 are work that was started or found and then postponed. Section 5
is the exception and is forward-looking: demand nobody has asked for yet, its
`D` refs originating here rather than in `REVIEW-FINDINGS.md`.

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

| Ref         | Item                                                                                                                                                                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S7**      | ~~Slider member and `Seek` naming~~ — **done**.                                                                                                                                                                                                                                                                            |
| **S8**      | ~~Split the inline styles~~ — **done**.                                                                                                                                                                                                                                                                                    |
| **S15**     | ~~Narrow the exported `SideEffectAction`~~ — **done**.                                                                                                                                                                                                                                                                     |
| **A9**      | ~~`aria-current` on the rate options is the wrong property~~ — **done**.                                                                                                                                                                                                                                                   |
| **A11**     | ~~`role="group"` is inconsistent across the three sliders~~ — **done**. Naming the player as a whole is **A10**, still open.                                                                                                                                                                                               |
| **A12**     | ~~The time display announces "elapsed" rather than "0:00"~~ — **done**.                                                                                                                                                                                                                                                    |
| **S16**     | ~~`ErrorMessage`, the three `Time` display parts and the `PlaybackRate` root accept no props~~ — **done**. The `format` prop it also asked for is part of **A15**.                                                                                                                                                         |
| **S17**     | `PlaybackRate.Current` is declared `React.ReactElement \| null` but never returns `null`: the non-current branch returns a `visibility: hidden` span that still occupies layout. Either outcome is breaking — returning `null` reflows, and keeping the span means correcting the type and documenting the reserved space. |
| **A4**      | ~~Toggle buttons change name _and_ `aria-pressed`~~ — **done**.                                                                                                                                                                                                                                                            |
| **A5 / A7** | ~~`aria-disabled` instead of native `disabled`~~ — **done**.                                                                                                                                                                                                                                                               |

### Additive

| Ref             | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**          | ~~No way to read player state~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **F5**          | ~~Stall signal~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **F6**          | Media Session API. The metadata fields on `AudioFile` were added ahead of this so it is not a breaking change when it lands.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| —               | **Playlist resumption is undocumented, and now more visible.** Following `onEnded`'s pattern gives a playlist that stops after every track: a `src` change arrives loaded and paused, and nothing resumes it. Two consumer-side fixes, neither discoverable from the README — `audioProps={{ autoPlay: true }}`, which also autoplays track one and may be refused by autoplay policy (surfacing as `useAudioError()` `kind: "playback"`); or an effect keyed on the playlist index calling `play()` after `loadedmetadata`. `AudioPlayer`'s `onEnded` tooltip now says this; the README's playlist section does not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| —               | **"Only one player at a time" is a consumer concern**, and worth saying so. Two players with two playlists is a plausible route to overlapping audio. A library-owned `autoAdvance` would need cross-instance coordination — exactly the shared registry the per-`AudioPlayer` store avoids — so the shape stands: the library exposes state and control, the consumer owns the queue.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| —               | `AUDIO_FILE_ENDED` is a defined action with a handler in `handleSideEffect`, and **nothing sends it**. It was the end-of-track rewind's action; with the rewind gone it is unreachable. Delete it, or find it a sender.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| —               | ~~Firefox has never run: `playwright.config.ts` had only a `chromium` project~~ — **done**: both engines run in CI, 112 tests. The two failures were test bugs, not library bugs — Playwright's Firefox substitutes `clientX = 0` outside the viewport and dispatches no `pointerup` for a release outside it, so four sites now go through `insideViewport()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| —               | Firefox **does** diverge on `ended`, measured on a bare element with no pointer simulation: a paused seek to `duration` sets `el.ended` and fires the event, where Chrome does neither. So a drag to the end of the timeline calls a consumer's `onEnded` — advancing their playlist — in Firefox only. `useIsAtEnd` is unaffected, being derived from position, which both browsers agree on. **Still undecided**: whether to paper over the divergence or document it. Now testable on both engines, so whichever is chosen can be pinned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| —               | ~~`drag-drop-time.spec.ts`'s `browserName === "firefox"` branch is a misdiagnosis of the coordinate collapse~~ — **done**: the branch is deleted rather than corrected. With the overshoot kept inside the viewport both engines agree, so there is nothing left to branch on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| —               | The drag effect (`useSlider.ts`) ends only on `pointerup` / `pointercancel` / `touchcancel` — no `blur`, `lostpointercapture` or `visibilitychange` fallback. Any lost `pointerup` leaves the drag live and `lastAudibleVolume` held indefinitely. Browser-agnostic, and the same neighbourhood as **C9**. Found while triaging the Firefox failures, which is exactly what a stuck drag looks like.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **S9** _(part)_ | Still open: the **state** attributes `data-state` (idle/dragging, playing/paused, muted/low/high), `data-orientation` and `data-disabled`. Drag state remains unreachable from CSS _and_ JS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **A6**          | ~~Home / End on the sliders~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **A8**          | ~~The volume slider announces "100%" while muted~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **A10**         | Nothing names or bounds the widget: `AudioPlayer` renders no element, so there is no landmark, no `role="region"` and no name. With two players on a page the AX trees are byte-identical. Shared responsibility — the library can offer the wrapper, the consumer has to name it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **A15**         | Every string is hardcoded English, and there is no way to supply your own. **Needs design before implementation — this row is a problem statement, not a plan.** (1) **Entries must be functions, not strings.** `aria-valuetext` renders "Position 1:30 of 3:00" and "Muted, 80%", and `PlayButton` has four state-dependent names — a static `aria-label` flattens all four to one string, which is a broken translation rather than a worse one. The controls needing this are exactly the three **A4** toggles plus the sliders: A4 put state on the name, and that is what makes a string bag insufficient. (2) **Three number formats, not one** — `formatTime`, `` `${Math.round(v * 100)}%` `` and `` `${Math.round(v * 100) / 100}x` ``. Two of them sit _inside_ larger strings ("Muted, 80%"), so labels and number formatting cannot be separate options; one mechanism passing raw values, with `Intl` left to the consumer. This also settles the open half of **S16**: time formatting is an entry in the surface, not a `format` prop on `Time.Elapsed`. (3) **Reach is already complete** — every English string is overridable per instance _except_ `aria-label="audio player"`, where `{...props}` is spread before the attribute (`AudioElement.tsx:65-67`), unreachable through `audioProps`. That is a one-line fix independent of this. So the surface buys ergonomics and the state-dependent cases, not reach. (4) Where it lives — one prop on `AudioPlayer` with per-component override. Before committing, write the German values for `PlayButton`'s four states, "Muted, 80%" and `1,5x`: those three exercise function-shaped entries, a number inside a sentence, and the decimal separator. |
| **F10**         | The shortcuts fire only when a library control has focus, but the default map (`j`/`k`/`l`, `0`–`9`, `<`/`>`) is YouTube's _global_ vocabulary, so readers assume page-wide. Suggested: a `keyTarget="document"` prop. Deferred because a document-level listener is the library reaching outside its own DOM, and needs an opt-in story for two players on a page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **F11**         | No persistence of volume, rate or position. Deliberately left out: with the hooks from **F1** shipped, a consumer builds this in ten lines, and a library that owns storage has to own the key naming and the SSR story too.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **S14**         | Missing or mis-nested children fail silently. Omit `.Control` and the geometry stays at `{0, 0}`: no `role="slider"`, no aria, no tab stop, clicks do nothing, no warning. Nest `.Thumb` inside `.Control` and you get a `<button>` inside a `<button>`. Wants dev-only warnings, stripped in production. The existing `SliderContext` provider guards show the standard to match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **S22**         | `Progress` stacks above `Background` only by accident — its `transform` creates a stacking context. A consumer who overrides `transform` (which **S20** invites) silently inverts them. Fix: an explicit `z-index` on `Background`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **S20**         | CSS custom properties (`--progress`, `--offset`) alongside the computed transform.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### Internal, no consumer impact

| Ref             | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1**          | ~~Rate-slider bounds live in three places and disagree~~ — **done**. `PlaybackRate.Change` clamps to neither bound — the open half of **C8**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **C2**          | `SLIDER_MODES.mutesAtZero` does not gate mute-at-zero; the real rule is keyed off `action.component` in another layer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **C3**          | `valueFromStoreRef` + its effect mirror a value `atom.get()` returns directly, and more freshly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **C4 / P1-b**   | The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **C5**          | The `ResizeObserver` effect binds a node it can never re-bind — hold it in `useState` like `AudioElement` does.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **C7**          | ~~`positionOf` duplicates the now-dead `getClientXY`; `Orientation` is declared twice~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **C8** _(part)_ | The 0.5–4 playback-rate policy is applied inconsistently: the slider arrows and the `>` key clamp there, `SET_PLAYBACK_RATE` does not. The write path now clamps to the browser's [0, 16] so nothing throws, but the library's own range is still unenforced — deliberately, since `<PlaybackRate.Set rate={8}>` names an explicit rate. Decide whether that is the intended contract.                                                                                                                                                                                                                                     |
| **F12**         | ~~`getOffset` lacks the `range === 0` guard its sibling has~~ — **done**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **A13**         | Float noise in `aria-valuenow`: the volume and rate modes use identity quantizers, so the value announces as `0.8999999999999999`. Shielded by `aria-valuetext` today, which is why it is not urgent — but rounding costs nothing and `seek` already does it.                                                                                                                                                                                                                                                                                                                                                              |
| **C10**         | `getProgress` takes `sliderLength` and never uses it arithmetically — it is a proxy for "not measured yet". Reasonable behaviour, misleading signature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **S21**         | `Volume`'s exported type carries a duplicated intersection in `dist/index.d.ts`, an artifact of the old `Object.assign(X as Y, {…})` pattern. Harmless, but it is the first thing a consumer sees in their editor.                                                                                                                                                                                                                                                                                                                                                                                                         |
| **P2-a**        | The 250 ms progress transition is correctly composited — measured: compositor-run, `LayoutCount` 0, zero `transitioncancel` over 8 s, ≈0.25 % of wall clock. The cost is GPU memory: layers 5 → 10, texture 78.3 → 83.4 MB, and the 4 extra promotions are `Overlap`-driven and include both Volume slider buttons, an unrelated part of the UI. A transition starts every ~256 ms, so those layers persist for all of playback. Recorded rather than actioned; **`will-change: transform` is contraindicated** — it would make the transient 5 MB permanent and buys nothing, since the transition is already composited. |
| **C9**          | The drag effect registers `touchcancel` but not `touchend`, while the press-wait block registers `touchend`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Tests

| Ref         | Item                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **T1**      | ~~`no-snap-back.spec.ts` samples `audio.currentTime`, but the element never snaps back — the UI does~~ — **done**.                   |
| **T2 / T3** | ~~Vacuous assertions in `progress-indicator.spec.ts`~~ — **done**.                                                                   |
| **T4**      | ~~`retries: 2` is unconditional~~ — **done**.                                                                                        |
| **T5**      | ~~One dead `vi.mock` call remains: `PlaybackRate.test.tsx:10` mocks the deleted `useAudioElement`~~ — **done**.                      |
| **T7**      | ~~30+ fixed `waitForTimeout` calls as the only synchronisation~~ — **done**.                                                         |
| **T8**      | ~~A fractional `numDigits` in `toBeCloseTo(x, 0.25)`~~ — **done**.                                                                   |
| **T9**      | ~~Two rate-button tests assert on the mock rather than the element~~ — **done**.                                                     |
| **T6**      | ~~The "grab-offset composition" block is arithmetic, not a test~~ — **done**.                                                        |
| **T10**     | ~~`toBeUndefined()` on a function that returns `void` on every path~~ — **done**.                                                    |
| **T11**     | ~~Change-detector tests in `calculateStyle.test.ts`~~ — **done**.                                                                    |
| —           | ~~No test asserts the `Timeline.Progress` CSS transition~~ — **done**.                                                               |
| —           | ~~Missing: a `useTimeDisplay` clamp test, a `useSliderContext` missing-provider row, a `{ mode: "rate", step: 0 }` row~~ — **done**. |

### Packaging

| Ref     | Item                                                                                                                                                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S18** | `react-dom` is an unnecessary peer dependency — zero references in the bundle.                                                                                                                                                                                                                                       |
| **S23** | Packaging is otherwise clean — `attw` green, `exports` ordered, `sideEffects: false` accurate. The nits: no `engines` field, and `require()` fails with an opaque error where a documented ESM-only note would help.                                                                                                 |
| **S19** | React 19 is untested; devDeps pin 18 and there is no CI matrix, so `>=18.0.0` is unverified. The toolchain update left `react`, `react-dom` and their types on 18 deliberately — moving them to 19 inverts the gap rather than closing it, since devDeps can pin only one version. The fix is a CI matrix over both. |
| —       | `tsup` 8.5.1's dts pipeline injects a `baseUrl`, which TypeScript 6 deprecates and 7 removes. `tsconfig.build.json` carries `ignoreDeprecations: "6.0"` so the dts build keeps working; TS 7 will break it regardless of the flag. Recheck when tsup releases a fix, and drop the flag then.                         |
| —       | No `engines` and no `browserslist`, so the ES2022 build target has nothing to check it against — the shipped bundle already contains `??=` (ES2021). Declaring a floor would make the target a decision rather than a default. Related to **S23**.                                                                   |
| —       | `typescript-eslint` 8.68 declares `typescript: >=4.8.4 <6.1.0`, which is why TypeScript is pinned at 6.0.3 rather than 7. Revisit when it widens.                                                                                                                                                                    |
| —       | pnpm 11 no longer reads the `pnpm` field in `package.json`, so `onlyBuiltDependencies` would be ignored and esbuild’s install script would not run. Harmless today, since local and CI both use pnpm 10, but it breaks on the next major. Move the setting to `pnpm-workspace.yaml` when adopting pnpm 11.           |
| —       | ~~Extend `type-check` to cover `tsconfig.node.json` as well as `tsconfig.app.json`~~ — **done**.                                                                                                                                                                                                                     |
| —       | `version` is still `0.0.0`; npm rejects that as a release version.                                                                                                                                                                                                                                                   |

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

---

## 5. Predicted demand — what to expect after the first publish

Added 2026-08-28, from a scan of what the neighbouring players are being asked
for. **These are not review findings.** The `D` refs originate in this file and
have no counterpart in `REVIEW-FINDINGS.md`, so the drift rule at the top does
not apply to them — there is nothing to reconcile against. They are predictions
about incoming requests, ordered by how much the answer costs once `version` is
no longer `0.0.0`.

**The market context, because it has a date on it.** In March 2026 the teams
behind Video.js, Plyr, Vidstack and Media Chrome shipped the first beta of
Video.js v10, a rewrite that folds all four players into one framework, with
general availability targeted for the middle of 2026. That consolidation is
video-first and web-component-first. It makes the position this library already
holds — audio only, React components rather than custom elements, nothing in
`dependencies` — both narrower and more defensible, and it is why the
podcast-shaped items below are the ones worth wanting.

### Decide before publish

**D1. Polymorphism: `asChild`, or a `render` prop. — breaking after publish.**
The README pitches the library as composed the way Radix is, and the most-used
thing in that API is missing: there is no `asChild`, no `render` prop and no
Slot anywhere in `src/`. Anyone with a design system reaches for it in the first
hour, because `PlayButton` renders a `<button>` they already have a styled
version of.

The field has split on which convention to offer, so this is a choice and not a
lookup: Radix keeps `asChild`, and Base UI went stable in December 2025 with
`render` instead, explicitly to avoid `asChild`'s prop-merging ambiguity around
event handlers and refs. Either is defensible. Deciding after publish is not —
it means shipping both, or breaking the prop type of all ten roots and their
members at once.

The merge semantics are the work, not the prop. Every part here already composes
handlers deliberately (`composeEventHandlers`), and the disabled rule — an
`aria-disabled` control swallows the consumer's own `onClick` — has to survive
being merged onto someone else's element.

**D2. Refs on the parts. — additive, but it touches every public prop type.**
`audioRef` reaches the `<audio>` element, which is the hard case and is already
solved. No _part_ forwards a ref: there is no `forwardRef` in `src/`, and the
types pin React 18, where `ref` is not an ordinary prop. Tooltips, popovers,
scroll-into-view, measurement and every animation library want an element
handle, and `Timeline.Control` is the one they want it on.

Coupled to **S19**: React 19 makes `ref` a plain prop and deletes the
`forwardRef` ceremony, so the shape of this depends on which React the types
target. That makes S19 a dependency of a pre-publish item rather than the
isolated chore it reads as today.

**D3. `volume` is inert on iOS, and nothing says so.** On iOS the audio level is
under the user's physical control by Apple's design: `HTMLMediaElement.volume`
is not settable from JavaScript and reading it always returns 1. `muted` still
works. So `writeVolume` assigns, the element ignores it, `syncFromElement` never
observes a change, the atom holds, and the thumb does not move. **The store is
behaving correctly and the user sees a dead slider** — which is the worst
combination available, because there is no bug to find.

Wanted: one derived signal, `useIsVolumeAvailable()` or similar, so a consumer
can drop `<Volume>` on iOS and keep `<MuteButton>`, which still works. The
detection is a capability probe rather than a UA test — assign a value other
than 1 and read it back — and a probe is a _write_, so it has to run once at
attach, before any consumer value is applied, and restore what it found. Ugly,
and still cheaper than the issue it prevents.

Media Chrome carries an open discussion titled "media-volume-range doesn't work
in iOS Safari"; react-h5-audio-player has "I can't control volume while using
audio player on iOS devices." This one gets filed.

**D4. Live streams are a supported case documented as an unsupported one.** The
README currently closes with "Live streams are not supported: an unbounded
duration reads as 0." That sentence costs more than the feature does. Internet
radio, live shows and call-ins are a large share of what goes into a web audio
player, and the architecture is already most of the way there: `useIsSeekable()`
exists _because_ `duration` is `Infinity` while `readyState` is healthy, and it
disables exactly the two controls that have to name a position on the track.
Play, pause, volume, mute and rate all work.

What is missing is a name for the state, and it cannot be derived from the atoms
as they stand — `syncFromElement.ts:76` flattens every non-finite duration to 0,
so by the time a consumer sees it, a live stream and a player before
`loadedmetadata` are the same number. So: project the distinction (an `isLive`
boolean, or keep the raw value alongside the flattened one), and rewrite the
README paragraph from a limitation into a branch.

### Additive — what the scan reorders in section 2

Nothing new here. What changes is the _order_, and these are the rows it moves
up:

- **F6 (Media Session)** is the largest single gap, not a nicety. Audio is
  consumed on phones with the screen off, and without it there is no artwork on
  the lock screen, no hardware buttons and no scrubbing from the notification
  shade. Do `setPositionState` in the same pass, or the lock-screen scrubber
  shows a frozen position and reads as a bug in the player rather than as a
  missing call. The metadata fields on `AudioFile` were added ahead of exactly
  this.
- **S9 (state attributes) with S20 (custom properties)** belong together and
  belong early. `data-part` shipped, which is half the styling contract; without
  the other half, drag state is unreachable from CSS _and_ from JS, so a
  grows-while-dragging thumb — the most common piece of slider polish there is —
  cannot be written at all. It also becomes frozen API the moment anyone styles
  against it. react-h5-audio-player has an open "Add support for css custom
  properties (variables)" request; this is the shape that request takes here.
- **The playlist-resumption row** (unrefed, in Additive) is a documentation bug
  with a reproduction: everyone who copies the README's playlist example gets a
  player that stops after every track. Fix the example, not the library.
- **A10 (nothing names the widget)** and the "only one player at a time" row are
  one answer rather than two: offer the wrapper and the labelling, document the
  pause-the-others recipe, and say in the README that coordination is the
  consumer's. react-player carries an open "Multiple instance issues on play and
  pause"; two players on a page is how people get there.
- **A15 (hardcoded English)** is the one item on the list a competitor names in
  its own feature table — react-h5-audio-player advertises internationalization
  directly. It also matters more here than in most libraries, because three of
  the toggles carry their entire state on the accessible _name_ rather than on
  `aria-pressed`. That is the right call, and it makes translation load-bearing
  rather than cosmetic.

**F11 (persistence) stays out**, and the scan strengthens the reason rather than
weakening it: Vidstack carries an open issue titled "`localStorage` not always
available, causing TypeErrors" — the cost of owning storage, itemised by someone
who owns it. Answer it with a recipe in the docs.

### Longer arc — where audio-only earns its narrowness

**D5. Let `Timeline` host a waveform rather than drawing one.** wavesurfer.js is
the centre of gravity for audio UI on the web, and it has a real gap: what it
draws is a canvas, not a `role="slider"` with arrow keys, `Home`/`End` and an
announced value. This library is the exact complement — the semantics with no
drawing. The move is not a renderer; it is making the slider root able to host
someone else's paint surface, so a consumer gets wavesurfer's pixels inside
these keyboard and screen-reader semantics. `useCurrentTime()` already exists
for the continuous redraw, and is already documented as being for this.

**D6. The podcast surface: chapters and markers first, transcript sync second.**
Chapter navigation, a transcript that follows playback, a sleep timer, silence
skipping and per-show speed are what podcast listeners now treat as baseline;
Podlove's Simple Chapters is an established web format for the first two. Two of
them fit the existing architecture almost for free — chapters and transcript
sync are both a sorted list plus `useCurrentSecond()`, and both want the same
new primitive: a `<Timeline>` that can render marks at positions, which is also
what **D5** and the buffered bar in section 3 want. The sleep timer and silence
skipping are userland and should stay there.

This is also the answer to "why not use the video player", which is worth being
able to give before it is asked.

**D7. An HLS/dash.js recipe, in the docs, not in the library.** `audioRef`
already makes attaching hls.js possible, and almost nobody will work that out
unaided. A worked example costs an afternoon and answers the request
permanently. The `<source>` codec fallback underneath it is the genuinely hard
one and stays deferred for the reasons in section 1.

### Not features

**D8. There is no docs site, no deployed demo and no sandbox link.** For a
headless library this is _the_ adoption gap, because there is nothing else to
look at: the markup is the consumer's, so the documentation is the product.
Radix and Base UI are chosen off their docs sites. The README here is
better-reasoned than most libraries' entire documentation, and it is 19 kB of
prose that someone comparing five players in an afternoon will not read. One
deployed page with four working players — minimal, podcast, waveform,
mini-player — each with copyable source, outperforms any three features above.
`public/The-Race.mp3` and the Vite dev app are most of the fixture already.

**D9. Publish the refusals.** This file reasons about what is deliberately
excluded better than most projects ever write down, and it does it where no
consumer will ever read it. A short "deliberately not included" section in the
README turns each of these from a recurring debate into a link: no queue or
playlist manager, no storage, no full `TimeRanges`, no video, no themes and no
bundled icons. Section 4 is the raw material; it wants a consumer-facing
paraphrase, not a copy.
