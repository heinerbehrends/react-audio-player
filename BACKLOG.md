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
| **S8**      | Split the inline styles: keep structural (`transform`, grid placement, `touch-action`), move opinion (`width/height: 100%`, `border`/`background`/`padding` resets, `cursor`) into an optional stylesheet. Inline styles currently beat every consumer class.                                                                                                                                                                                                                                                             |
| **S15**     | Narrow the exported `SideEffectAction` to a `KeyboardAction` union; export `SliderComponent`, which is referenced by the public type but not exported.                                                                                                                                                                                                                                                                                                                                                                    |
| **A4**      | ~~Toggle buttons change name _and_ `aria-pressed`~~ — **done**: the name is the only state channel on all three toggles. `aria-pressed` is gone from `PlayButton`, `MuteButton` and `Time.Toggle`, and `Time.Toggle` gained a changing name ("Show time elapsed" / "Show time remaining") to match. The name reaches further than a boolean: `PlayButton` also announces `loading` and `error`.                                                                                                                           |
| **A5 / A7** | ~~`aria-disabled` instead of native `disabled`~~ — **done**: the six gated buttons and all three sliders. `useDisabledButtonProps` also blocks activation, which the browser used to do, the consumer's own `onClick` included. A disabled slider ignores its arrow keys without letting them fall through to the global map, where `ArrowRight` seeks. The global shortcuts stay live on a disabled control, deliberately — they belong to the player, and already fired from every other focused element in that state. |

### Additive

| Ref             | Item                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**          | ~~No way to read player state~~ — **done**: `useAudioPlayer`, `useCurrentSecond`, `useCurrentTime`, `useIsBuffering` and `useAudioError` are exported.                                                     |
| **F5**          | ~~Stall signal~~ — **done**: `readyState` is projected and `useIsBuffering()` derives from it. Buffered _ranges_ remain, see section 3.                                                                    |
| **F6**          | Media Session API. The metadata fields on `AudioFile` were added ahead of this so it is not a breaking change when it lands.                                                                               |
| **S9** _(part)_ | Still open: the **state** attributes `data-state` (idle/dragging, playing/paused, muted/low/high), `data-orientation` and `data-disabled`. Drag state remains unreachable from CSS _and_ JS.               |
| **A6**          | ~~Home / End on the sliders~~ — **done**: both jump through `commit`, so the seek slider does not snap back. Slider-scoped deliberately — everywhere else the two keys stay the browser's.                 |
| **A8**          | ~~The volume slider announces "100%" while muted~~ — **done**: `aria-valuetext` composes the two ("Muted, 80%"). `aria-valuenow` is left alone, since it is the volume and muting does not move the thumb. |
| **S20**         | CSS custom properties (`--progress`, `--offset`) alongside the computed transform.                                                                                                                         |

### Internal, no consumer impact

| Ref             | Item                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1**          | Rate-slider bounds live in three places and disagree — `<PlaybackRateSlider maxValue={2}>` still clamps arrows at 4.                                                                                                                                                                                                                                                                   |
| **C2**          | `SLIDER_MODES.mutesAtZero` does not gate mute-at-zero; the real rule is keyed off `action.component` in another layer.                                                                                                                                                                                                                                                                 |
| **C3**          | `valueFromStoreRef` + its effect mirror a value `atom.get()` returns directly, and more freshly.                                                                                                                                                                                                                                                                                       |
| **C4 / P1-b**   | The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.                                                                                                                                                                                                                                                                      |
| **C5**          | The `ResizeObserver` effect binds a node it can never re-bind — hold it in `useState` like `AudioElement` does.                                                                                                                                                                                                                                                                        |
| **C7**          | `positionOf` duplicates the now-dead `getClientXY`; `Orientation` is declared twice.                                                                                                                                                                                                                                                                                                   |
| **C8** _(part)_ | The 0.5–4 playback-rate policy is applied inconsistently: the slider arrows and the `>` key clamp there, `SET_PLAYBACK_RATE` does not. The write path now clamps to the browser's [0, 16] so nothing throws, but the library's own range is still unenforced — deliberately, since `<PlaybackRate.Set rate={8}>` names an explicit rate. Decide whether that is the intended contract. |
| **C9**          | The drag effect registers `touchcancel` but not `touchend`, while the press-wait block registers `touchend`.                                                                                                                                                                                                                                                                           |

### Tests

| Ref             | Item                                                                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T1**          | ~~`no-snap-back.spec.ts` samples `audio.currentTime`, but the element never snaps back — the UI does~~ — **done**, and mutation-proven: both rows fail when the retain-until-changed rule is deleted. |
| **T2 / T3**     | ~~Vacuous assertions in `progress-indicator.spec.ts`~~ — **done**: the fill is selected by `data-part="progress"`, and T3 plays until `aria-valuenow` moves before comparing like for like.           |
| **T4**          | `retries: 2` is unconditional despite a comment saying "CI only", so a flaky row reports green on a blocking gate.                                                                                    |
| **T5** _(part)_ | One dead `vi.mock` call remains: `PlaybackRate.test.tsx:10` mocks the deleted `useAudioElement`. The `useHandleSideEffect` one is gone.                                                               |
| —               | No test asserts the `Timeline.Progress` CSS transition, in either branch.                                                                                                                             |
| —               | Missing: a `useTimeDisplay` clamp test, a `useSliderContext` missing-provider row, a `{ mode: "rate", step: 0 }` row.                                                                                 |

### Packaging

| Ref     | Item                                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **S18** | `react-dom` is an unnecessary peer dependency — zero references in the bundle.                                               |
| **S19** | React 19 is untested; devDeps pin 18 and there is no CI matrix, so `>=18.0.0` is unverified.                                 |
| —       | Extend `type-check` to cover `tsconfig.node.json` as well as `tsconfig.app.json`; the config files were unchecked until now. |
| —       | `version` is still `0.0.0`; npm rejects that as a release version.                                                           |

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
