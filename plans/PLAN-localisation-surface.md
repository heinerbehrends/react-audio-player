# Plan: the `labels` surface (A15), and the last of S16

**A15** asks for one thing: a way to supply your own strings. The ticket left the design
open deliberately — it is a public API on the root component, and the shape is the whole
decision. This plan settles the shape, then lands it in four phases ordered by how broken
each tier actually is.

Nothing here is breaking except one deletion, called out in phase 3 and argued below. Every
entry is optional and every component keeps the English it has today as its fallback, so a
consumer who passes no `labels` sees no change.

## Status: shipped 2026-09-16 — all four phases. See the resolution on A15.

---

## What is actually wrong

The ticket's opening paragraph is the original review text and is now partly stale.
**`ErrorMessage` is not part of this.** S16 shipped: it takes the full `HTMLAttributes`
bag, and its text has always been the consumer's `children`. There is no English string in
it. Likewise point (3) — `aria-label="audio player"` being unreachable — shipped on
2026-09-15 and is pinned by `AudioElement.test.tsx`.

What is left is 17 strings in three tiers. One of them is deleted rather than localised, so
the surface is **16 entries**.

| tier                          | where                                                                                             | can a per-instance `aria-label` replace it?          |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **1 — state-dependent names** | `PlayButton` ×4, `MuteButton` ×2, `Time.Toggle` ×2                                                | **No** — a static string flattens four states to one |
| **2 — value-dependent text**  | three `aria-valuetext`, the three `<time>` readouts, `RateDisplay`'s text                         | **No** — it changes with the value                   |
| **3 — static / prop-derived** | `"audio player"`, three slider labels, `"Playback rate options"`, `SeekButton`, `.Set`, `.Change` | **Yes** — already overridable today                  |
| **deleted, not localised**    | `"Current playback rate"` on `RateDisplay`                                                        | — see below                                          |

Tiers 1 and 2 are the defect. Tier 3 works, and is an ergonomics problem: a German app
writes `aria-label` at seven-plus call sites and silently keeps English wherever someone
forgets one.

### `RateDisplay`'s name is deleted, not translated

`SetPlaybackRate.tsx:120-130` renders:

```jsx
<span data-part="rate-display" aria-label="Current playback rate" {...props}>
  {roundedRate}x
</span>
```

That is the pattern **A12** removed from `Time.*`, and its resolution says why:

> `<time>` maps to no ARIA role, and naming a generic element is not reliably announced, so
> the label was **as likely to be dropped as to hide the value**.

A `<span>` is `role="generic"` too, so this attribute is in one of two states, both bad:
dropped, or replacing "1.5x" with a phrase that names the widget and withholds the number.
Translating it into German buys a string that fails to be announced in German.

So it goes, and there is no `rateDisplayLabel` entry. The text is the name, exactly as A12
concluded for the clocks; `data-part="rate-display"` remains the query and styling hook, and
a consumer who genuinely wants the span named can still pass `aria-label` through
`{...props}`. The outcome is symmetric with the clocks: `Time.*` has `time` and no name
entry, `RateDisplay` has `rateDisplay` and no name entry.

This is the one breaking change here, in the same sense A12 was breaking: a consumer
selecting on `[aria-label="Current playback rate"]` loses it. The JSDoc already steers
people to `data-part`, and one E2E spec of our own relies on it — see phase 3.

## Decisions already taken

Recorded here so they can be argued with, not so they can be assumed.

**One `labels` prop on `AudioPlayer`, holding an object of optional entries.** The ticket's
point (4). Per-instance override already works for free: every `"aria-label"` in the props
bags sits _before_ `...props`, so a call-site prop still beats the root prop without any new
plumbing. Precedence is per-instance `aria-label` → `labels` entry → the English default.

**Two shapes, one rule: a fixed set of states gets an object of strings, a number in the
text gets a function.** This is the ticket's point (1), corrected. The ticket argues German
proves entries must be _functions_ — `loading` is "Audio wird geladen", a passive
construction, while `paused` is "Audio abspielen", an infinitive, and no template with a
swapped verb produces both. That argument is right about the conclusion it actually
supports: you need **four independent strings rather than one template**. It does not
support functions, because an object of four strings is four independent strings:

```ts
play: {
  playing: "Audio pausieren",
  paused:  "Audio abspielen",
  loading: "Audio wird geladen",
  error:   "Fehler beim Laden des Audios",
}
```

A function is unavoidable only where a **number is interpolated** — "Stumm, 80 %", "1,5x",
"Position 1:30 von 3:00", "10 Sekunden vorspulen". Those cannot be written down in advance.
Everything else is a finite, countable set of sentences. So eight entries are data and eight
are functions, and the rule fits on one line.

Three things follow from keeping half the surface as plain data, and they are the reason to
prefer it over uniform functions:

1. **It works from a React Server Component.** React refuses to pass a function from a
   Server Component to a Client Component. The library ships `"use client"`
   (`tsup.config.ts:23`, applied twice so a treeshake cannot strip it) precisely so the
   Next.js App Router works — **S3** was a P0. An all-function `labels` would mean that
   adding German forces a client boundary that rendering the player today does not. Under
   this shape, only an app needing the number entries needs one.
2. **It matches how translations are stored.** A consumer keeps a `de.json`. An object drops
   straight in; a function is glue they write.
3. **The compiler still catches the missing state.** `Record<PlayerState, string>` requires
   all four keys, so forgetting `loading` is an error at the call site.

The cost is that two entries read as self-contradictory — `mute: { muted: "Ton
einschalten" }`, where the state is "muted" and the word is "unmute". That inversion is
inherent to the buttons (the state says what _is_, the name says what _pressing does_), and
a line that looks wrong is likelier to be checked than a ternary that slides past. It is
documented rather than designed away.

**Function entries return `string`, never `string | undefined`.** The surface's most likely
bug is a half-written function that covers two of four states and returns nothing for the
rest — a German app that says "Loading audio" while buffering, with no error. Typed as
`=> string`, TypeScript refuses to compile it. Typed as `=> string | undefined`, it ships.
The one thing this forbids — deliberately translating some cases and leaving others English
— is not worth wanting, and is still expressible by returning the English string, where it
is at least visible.

At runtime, a function that _does_ return `undefined` (a translation library with a missing
key, say) falls through the `??` to the English default rather than dropping the name.
That is a property worth documenting in the README and worth keeping out of the type, since
putting it in the type is exactly what switches off the check above.

**State-dependent entries are keyed by the component's `data-state` value.** `play` by
`PlayerState`, `mute` by `VolumeState`, `timeToggle` by `TimeDisplayState` — the same three
sets of values already shipped as attributes and documented in the styling section
(`README.md:326-328`), which already says why they are stable:

> The state values are API — renaming `loading` would break your stylesheet — so they are
> named in the props hooks' return types as well.

One vocabulary, learned once, in two places. It also settles `mute` looking wrong: it has
three states and two names, because `low` and `high` both mean "audible, so pressing mutes".
That is a mismatch only under a rule of one value per name; under "the keys are the
`data-state` values" it is simply what the attribute has.

**Entries receive raw values, never preformatted substrings.** The ticket's point (2).
German writes "80 %" with a non-breaking space and "1,5x" with a decimal comma;
`Intl.NumberFormat("de-DE", { style: "percent" }).format(0.8)` produces the first correctly
and `Intl.NumberFormat("de-DE").format(1.5)` the second. Hand the entry a finished `"80%"`
and the consumer's only recourse is string surgery. This is why labels and number formatting
cannot be separate options — one mechanism, raw values, `Intl` is the consumer's.

**No central defaults module, and therefore no merge step.** This is the constraint the
ticket does not mention and the one most likely to bite. **P1-a** measured exactly this
symptom: a `PlayButton`-only bundle contained `"Volume slider"` and `"Timeline slider"`. A
`defaultLabels` object imported by `AudioPlayer`, or by any merge helper, drags every string
back into every bundle and undoes the 4,025 B → 1,137 B win this project already paid for.

Why, plainly: a bundler can only drop a **whole module** nothing touches. It cannot reach
inside one and keep half. So the moment `PlayButton` reaches into a shared file for its own
four names, that file survives — and it carries all sixteen strings with it. A consumer who
imports one button ships the slider's vocabulary.

The answer is that the context carries a **`Partial`** and each component keeps its own
local literal as the fallback:

```ts
"aria-label": labels?.play?.[playerState] ?? ariaLabelMap[playerState],
```

No merge, no defaults module, partial override is free, and each string stays in the only
module that uses it. The record shape makes this strictly simpler than the function form it
replaces: a lookup, not a call.

**`useLabels()` costs nothing to add.** It reads `PlayerConfigContext`, which is already in
every control's import graph — `useComposedButtonProps` → `useHandleMediaKeys` →
`usePlayerConfig` (`handleMediaKeys.ts:1,95`), and `useSlider` takes the same path
(`useSlider.ts:5`). No control gains a module it did not already have.

**Locale switching works by construction.** `labels` is read during render, and every
control already subscribes to `PlayerConfigContext`, so passing a new object re-renders all
of them. `PlayerConfigProvider` is deliberately unmemoised and rebuilds its value object
every render already; `labels` changes nothing about that.

**The full bag, not the narrow one.** A narrow bag of seven — only what a static prop cannot
express — is a smaller surface, but it means a German app localises through two mechanisms
and keeps English wherever it misses one. With every entry optional the extra nine cost
nothing.

**Object parameters for the function entries, not positional.** `SliderAriaState`
(`sliderModes.ts:10-14`) already sets the precedent, and an object parameter can gain a
field without a breaking change. Slightly noisier for the single-argument entries; worth it
on a public API.

**`time` does not feed the timeline's `aria-valuetext`.** `timelineValue` receives raw
seconds for both ends and formats them itself. Cross-referencing entries would force a
merge-then-bind resolution pass — exactly the central-defaults module ruled out above. In
practice a consumer writes one local `clock()` helper and calls it from both, which is what
the German fixture does. Document that overriding `time` does not change the slider text.

### Refused

**A `t(key, params)` function.** A discriminated-union request object typed one entry per
key, returning `undefined` to fall back to English. It adapts to an existing i18n stack in a
few lines and partial override is trivial. Refused because it is the same sixteen shapes in
a less discoverable form: the consumer who only wants German writes a `switch` where an
object literal would do, and the union type becomes the one place every payload lives. It is
also a function, and so carries the Server Component restriction across the whole surface
rather than half of it. The object form adapts to `react-i18next` just as cleanly —
`labels={{ play: { playing: t("player.playing"), … } }}` reads `t` from the render
scope, and a locale change re-renders every control.

**Documenting the props-hook workaround instead of shipping anything.** Tier 1 is already
solvable: `const bag = usePlayButtonProps(); <button {...bag} aria-label={t(bag["data-state"])} />`
works today, because `data-state` carries the state. Tier 2 is not. `useSlider` is not
exported, so the consumer must recompute `aria-valuetext` from `useAudioPlayer()` and
re-derive the A13 quantization by hand — and when they get it wrong, `aria-valuetext` and
`aria-valuenow` drift apart with nothing to catch it.

**Shipping locale bundles (`de`, `fr`, …).** The obvious i18n instinct. It puts translation
maintenance on a headless library and still cannot match a consumer's tone — "Ton
ausschalten" or "Stumm schalten" is their decision, not ours.

## The shape

One new exported type, plus `TimePart`. `PlayerState`, `VolumeState` and `SliderAriaState`
are types the library already has; `TimeDisplayState` is renamed and newly exported in
phase 1.

```ts
export type TimePart = "elapsed" | "remaining" | "duration";

export type PlayerLabels = {
  /** The `<audio>` element's name. */
  player?: string;

  // Tier 1 — the three toggles, keyed by the value on their `data-state` (A4, S9).
  // All keys required: a missing state is a compile error, not a silent English name.
  play?: Record<PlayerState, string>;
  mute?: Record<VolumeState, string>;
  timeToggle?: Record<TimeDisplayState, string>;

  // Tier 3 — named from a prop, so the number is only known at the call site.
  seek?: (state: { amount: number }) => string;
  rateSet?: (state: { rate: number }) => string;
  rateChange?: (state: { amount: number }) => string;
  rateGroup?: string;

  // Tier 2 — the sliders. The names are static; the spoken values share one
  // payload so `useSlider` can index them by mode. `rateValue` ignores
  // `maxValue` and `muted`.
  timelineSlider?: string;
  volumeSlider?: string;
  rateSlider?: string;
  timelineValue?: (state: SliderAriaState) => string;
  volumeValue?: (state: SliderAriaState) => string;
  rateValue?: (state: SliderAriaState) => string;

  // Tier 2 — visible text. Settles the open half of S16.
  time?: (state: { seconds: number; part: TimePart }) => string;
  rateDisplay?: (state: { rate: number }) => string;
};
```

Four notes on that.

**The keys pair mechanically.** A slider's name ends in `Slider`, its spoken value ends in
`Value`. Guess one and you have the other, which matters more than description in a
sixteen-key object — an earlier draft had `volumeLevel` beside `timelinePosition` and
`ratePosition`, where nothing tells you which of the three words to try.

**`seek`, `rateSet` and `rateChange` take the signed number.** The consumer decides the
direction wording and the pluralisation; German puts the verb last — "10 Sekunden
vorspulen" — which no `${direction}` slot in an English sentence can produce.

**`time` takes a magnitude plus a `part`, not a signed number.** The division is: the
**library owns which number** — `0` while loading, `0` at the end, never negative — and the
**consumer owns how it reads, sign included**. So a `time` entry handling
`part === "remaining"` must write its own `-`, exactly as a `volumeValue` entry writes its
own "Stumm, ". Passing `-90` instead would force `formatTime` to grow negative handling,
whose current job is the opposite — clamping negatives to `0:00` for
`duration - currentSecond`.

This is the surface's one quiet failure mode and it needs the docs to carry it.
`Time.Elapsed` and `Time.Remaining` render into the same slot and exactly one shows
(`TimeDisplay.tsx:88-128`), so a consumer who writes `time: ({ seconds }) => clock(seconds)`
gets two identical readouts and a `Time.Toggle` that looks dead. It type-checks, it renders
a plausible clock, and the only symptom is a missing hyphen. The README's `time` row carries
a worked `remaining` example for that reason.

**`time` never receives a non-finite number.** `duration` is `NaN` before metadata and
`Infinity` for a live stream, but the store normalises on write — `finite()`,
`syncFromElement.ts:78-80` — so every atom feeding a readout is already a finite number ≥ 0.
No entry has to guard, and `Time.Duration` can pass `duration` straight through.

---

## Phase 1 — the surface, the three toggles, and `seek`

### The change

`PlayerLabels` and `TimePart` go in a new `src/Shared/playerLabels.ts` — types only, so the
module erases at build and adds nothing to any bundle.

**Every import in that file must be `import type`.** `SliderAriaState` lives in
`sliderModes.ts`, which also holds `SLIDER_MODES` — a real runtime object carrying all three
sliders' English strings. A value import there would drag the whole slider table into every
module that touches `PlayerLabels`, re-breaking precisely what P1-a fixed. Invisible when
wrong until the bundle is re-measured.

`PlayerConfig` gains `labels: PlayerLabels | undefined`, alongside
`customKeyboardShortcuts`, which is exactly what that context is for: "static props flowing
strictly downward, neither state nor a projection of the element"
(`PlayerConfigContext.tsx:24-29`). `AudioPlayer` gains the `labels?: PlayerLabels` prop and
forwards it.

`useLabels()` sits beside `usePlayerConfig` in the same file:

```ts
export function useLabels(): PlayerLabels | undefined {
  return usePlayerConfig().labels;
}
```

**Exports.** `index.ts` gains `PlayerLabels` and `TimePart`. Without them the feature is
half-shipped: an inline `labels={{ … }}` infers fine, but the common case of one object per
language — `const german: PlayerLabels = { … }` — cannot be written down.

**Rename.** The store's `TimeDisplay` type (`createPlayerStore.ts:10`) becomes
`TimeDisplayState`, and is exported from `index.ts`. Three reasons: `timeToggle`'s keys need
a nameable type; `PlayerState` and `VolumeState` are already exported and this one was
missed; and `TimeDisplay` as a public name reads like a component next to the `Time`
namespace it lives beside — `TimeDisplay.tsx:14` already imports it
`as TimeDisplayState` for that exact reason. Four internal sites.

Then the three toggles, each keeping its existing literal as the fallback:

- `PlayButton.tsx:43` → `labels?.play?.[playerState] ?? ariaLabelMap[playerState]`
- `MuteButton.tsx:37` → `labels?.mute?.[volumeState] ?? (volumeState === "muted" ? "Unmute" : "Mute")`
- `TimeDisplay.tsx:59-60` → `labels?.timeToggle?.[timeDisplay] ?? (…)`

`ariaLabelMap` stays a module constant. Do not inline it into the fallback expression; it is
the table A4 argued for, and it is easier to read as one.

And `seek`, the one function entry in this phase:

- `SeekButton.tsx:58-60` → `labels?.seek?.({ amount }) ?? (…)`

### Why these four first

The three toggles alone would no longer exercise the design. Under the record shape they are
three dictionary lookups with nothing to get wrong, while all the remaining risk sits in the
function half — whether a number reads correctly inside a translated sentence, whether the
slider table indexes without a cast, whether the clock sign contract survives contact.

`seek` is the cheapest function entry there is: one component, one number, no state, no
slider machinery. It proves the second shape at the same size as the first, and it exercises
the thing German was supposed to prove — the verb goes last:

```ts
seek: ({ amount }) =>
  `${Math.abs(amount)} Sekunden ${amount > 0 ? "vorspulen" : "zurückspulen"}`;
```

Both shapes proven, and still small enough that getting it wrong is four one-line changes to
undo.

### Tests

`testJSDom/labels/` is new.

- Each of the three toggles: the entry supplies the name, in every one of its states — four
  for `PlayButton`, **three** for `MuteButton` (`muted`, `low`, `high`, the last two both
  naming "Mute"), two for `Time.Toggle`. A test that only checks `paused` would pass against
  a design that cannot express the other three.
- `seek` receives the signed `amount`, asserted for both a forward and a backward button.
- Absent entry → the English fallback, unchanged.
- A partial bag (`{ play }` only) → `MuteButton` still English. This is the property the
  no-merge design buys and the one a later refactor would silently break.
- A per-instance `aria-label` beats the root `labels` entry.
- `labels` swapped at runtime re-renders the controls with the new names.

---

## Phase 2 — the sliders

The genuinely unfixable tier, and the reason this ticket cannot be closed with
documentation.

### The change

`SLIDER_MODES` already exists to be "everything the three sliders differ on, in one table"
(`sliderModes.ts:17`). Two more fields per mode fit that brief exactly:

```ts
seek: {
  …,
  labelKey: "timelineSlider",
  valueKey: "timelineValue",
},
```

`useSlider` then reads them without a per-mode branch:

```ts
const labels = useLabels();
…
"aria-label": labels?.[config.labelKey] ?? config.ariaLabel,
"aria-valuetext":
  labels?.[config.valueKey]?.(ariaState) ?? config.ariaValueText(ariaState),
```

where `ariaState` is the `{ value: ariaValue, maxValue, muted }` object built once, which
`useSlider.ts:451-455` already constructs inline.

**This is why all three value entries share one payload.** Indexing `labels` by a union of
keys yields a union of function types, and TypeScript will not call one whose parameters
differ. Giving `volumeValue` a `{ volume, muted }` payload and `timelineValue` a
`{ value, maxValue }` payload forces a three-way `switch` in `useSlider` that the mode table
exists to avoid. One payload — `SliderAriaState`, already the shape `ariaValueText` takes —
and the index types cleanly. `rateValue` ignoring two of its three fields is the price, and
it is cheap.

Why, plainly: at the line above, `useSlider` does not yet know which of the three slider
kinds it is — that is the point of looking the entry up through the mode table. So it is
holding one of three functions without knowing which, and to call that it needs an argument
**all three** would accept. Three locks, one key. Give the three entries three different
payloads and no such argument exists, so the only way back is a `switch` on the mode —
re-deriving, at the call site, the very thing `SLIDER_MODES` is there to have already
decided.

The three slider _names_ are plain strings under the two-shape rule, so `labelKey` indexes
to `string | undefined` and needs no such care. Only the value entries do.

`SliderAriaState` becomes public: export it from `index.ts` and give it a JSDoc block aimed
at a consumer rather than at this file.

### The quantization stays ours

`ariaValue` is already quantized — `Math.floor` for seek, hundredths for the other two
(A13) — and the entry receives the quantized number, not the raw one. That is deliberate:
`aria-valuetext` and `aria-valuenow` must describe the same number, and handing the entry
the raw float is how they drift. Comment it at the call site; it will look like a missing
`displayValue` to the next reader.

### Tests

- All three `aria-valuetext` entries supply the text, asserted on the rendered attribute.
- All three slider `aria-label` entries supply the name.
- `volumeValue` receives `muted: true` while muted and `false` while not — the A8 behaviour,
  now flowing through the entry.
- `timelineValue` receives `maxValue` equal to the duration, and the seek slider's
  floor-quantized `value`.
- The entry's `value` equals the element's `aria-valuenow`. This is the drift guard; it
  should be a single assertion comparing the two attributes, not two separate expectations.
- Absent entries → today's English, for all three modes.
- A per-instance `aria-valuetext` on `.Control` still wins, since `aria` is spread before
  `props` (`SliderControl.tsx:41-45`; S5, A14).

---

## Phase 3 — the readouts, the deletion, and the rest of tier 3

### The change

The visible text, which settles the open half of **S16** — time formatting is an entry in
this surface, not a `format` prop on `Time.Elapsed`:

- `Time.Elapsed` → `labels?.time?.({ seconds: elapsed, part: "elapsed" }) ?? formatTime(elapsed)`
- `Time.Duration` → the same with `part: "duration"`
- `Time.Remaining` → `part: "remaining"`, and the fallback keeps today's `` `-${formatTime(remaining)}` ``

The loading and end-of-track branches stay where they are. `Time.Elapsed` renders `"0:00"`
while loading and `Time.Remaining` renders `"0:00"` at the end; those are library rules about
_which number_ to show, not about how to render one. The entry is called with `seconds: 0`
in both cases, so a locale that uses different digits still gets them — and so a consumer
can distinguish the zero case, which is how they know not to write a `-0:00`.

**`RateDisplay`, both halves.** Delete `aria-label="Current playback rate"` for the reason
argued at the top, and route the text through the entry:

- `SetPlaybackRate.tsx:125` → the attribute goes
- `SetPlaybackRate.tsx:128` → `labels?.rateDisplay?.({ rate: roundedRate }) ?? \`${roundedRate}x\``

The entry receives the **rounded** rate, for the same reason the sliders receive the
quantized value: what is announced and what is displayed must be one number.

**One E2E spec breaks on that deletion, and it is ours.**
`testE2E/PlaybackRate/rate-drag.spec.ts:78` reads:

```ts
await expect(page.getByLabel("Current playback rate")).toHaveText("1.1x");
```

Fix it in the same commit: locate by `[data-part="rate-display"]`, keep asserting the text.

Then the remainder of tier 3, each a one-line fallback like phase 1:

- `AudioElement.tsx:62` → `labels?.player ?? "audio player"`
- `PlaybackRate.tsx:29` → `labels?.rateGroup ?? "Playback rate options"`
- `SetPlaybackRate.tsx:70` → `labels?.rateSet?.({ rate }) ?? (…)`
- `ChangePlaybackRate.tsx:57-60` → `labels?.rateChange?.({ amount }) ?? (…)`

### Tests

- Each of the three `Time` parts renders through `time`, with the right `part`. Assert this
  with a marker function — `` ({ seconds, part }) => `${part}@${seconds}` `` — and three
  expectations reading `elapsed@…`, `remaining@…`, `duration@…`. That pins the routing and
  the magnitudes in one cheap test and fails loudly against an implementation that forgets
  to pass `part`. German proves nothing here: `1:30` is `1:30` in de-DE.
- `Time.Remaining` while loading and at the end calls the entry with `seconds: 0` — not with
  a negative, and not skipping the entry to render a hardcoded `"0:00"`.
- `RateDisplay` renders no `aria-label` at all, and its text is overridable.
- The four remaining tier-3 names.
- `AudioElement`'s existing `audioProps={{ "aria-label": … }}` row still passes: the
  per-instance override and the `labels` entry must not fight, and the spread order says
  `audioProps` wins.

---

## Phase 4 — the German fixture, docs, and ticket hygiene

### The German fixture

The ticket asks for the German values to be written before committing. Make that a test
rather than a paragraph: `testJSDom/labels/german.test.tsx`.

**It is a proof, not a translation exercise.** Only cover the cases where German genuinely
differs from English — the mechanism tests in phases 1–3 already cover payloads, fallbacks
and precedence, and a German string that renders identically to the English one asserts that
the code ran rather than that it was right.

```ts
const nf = new Intl.NumberFormat("de-DE");
const pf = new Intl.NumberFormat("de-DE", { style: "percent" });
```

Three assertions carry the ticket's demand, and each fails under a design this plan rejected:

1. **`Audio wird geladen` beside `Audio abspielen`** — four independent constructions, so
   one template with a swapped verb cannot produce the set. This is what defeats a
   _single-string_ `aria-label`; it does not defeat an object of four strings, which is why
   `play` is one.
2. **`Stumm, 80 %`** — `pf.format(0.8)` puts U+00A0 before the sign. Assert the non-breaking
   space explicitly, or the test passes against a plain `" %"` and proves nothing. This is
   the number-inside-a-sentence case, and it only works because the entry receives `0.8`.
3. **`1,5x`** — the decimal comma, which only exists because the entry receives `1.5` rather
   than `"1.5"`.

| entry         | German                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| `play`        | `Audio pausieren` / `Audio abspielen` / `Audio wird geladen` / `Fehler beim Laden des Audios` |
| `volumeValue` | ``muted ? `Stumm, ${pf.format(value)}` : pf.format(value)``                                   |
| `rateValue`   | `` `${nf.format(value)}x` ``                                                                  |

Write the assertions as literals, not by calling `Intl` in the expectation too. An
expectation built the same way as the value under test asserts that the code ran, not that
it was right.

### Docs

**README.** A `## Localisation` section after `## Accessibility`, since the accessibility
section is where every one of these strings is currently quoted as a promise. It needs:

- the `labels` prop and the full 16-entry table
- **the one rule** — a fixed set of states takes an object of strings, a number in the text
  takes a function — and why (a `de.json` drops in, and a Server Component can pass the data
  half)
- the raw-values rule: entries get `0.8` and `1.5`, `Intl` is yours
- the precedence: per-instance `aria-label` beats `labels` beats the English default
- **the two inversions**, spelled out rather than left to be inferred from the English:
  `state: "muted"` produces "Unmute", `state: "elapsed"` produces "Show time remaining". The
  state says what _is_; the name says what _pressing does_.
- **the `time` sign**, with a worked `remaining` example, because that is the line people
  will copy and the one whose failure is silent
- a note that overriding `time` does not change the timeline's `aria-valuetext` —
  `timelineValue` formats its own clocks, and one local helper called from both is the
  intended shape
- the `react-i18next` one-liner, which is the integration most consumers will actually want

Then fix the section above it. "Pass your own `aria-label` to override any of them" is no
longer the whole story, and `<Time.Elapsed>`'s "no `format` prop" needs to point here.
`RateDisplay`'s "Named 'Current playback rate' for assistive technology" is now false.

`data-part` is already documented as the selector that survives translation
(`README.md:314-316`, `useComposedButtonProps.ts:59-62`). Link the two: that advice is this
feature's other half.

**JSDoc.** Every component whose name is now overridable says so, on the `export const` root
rather than the implementation — tsup's `.d.ts` drops the rest.

### Ticket hygiene

- **A15** → `issues/resolved/accessibility/`, with the resolution recording what shipped and
  the German fixture as the evidence.
- **S16** is already resolved, but it defers its `format`-prop question to A15. Add one line
  saying where that landed.
- **A new tests ticket** for the E2E locators — see below. Filed, not fixed.
- `node scripts/issues.mjs` to regenerate the index, in the same commit.

---

## The E2E suite selects by `aria-label`, and that is a separate ticket

An earlier draft of this plan asserted that no E2E spec selects by `aria-label`. That is
false. `testE2E/test-utils.ts:218` exports an English label fixture and roughly ten specs
find elements with it:

```ts
const timeline = page.getByLabel(labels.timeline); // "Timeline slider"
await page.getByLabel(labels.seekForward).focus();
```

Which is the thing the library itself warns consumers not to do
(`useComposedButtonProps.ts:59-62`): "`button[aria-label="Play audio"]` breaks the day the
app ships in German."

Two different things look alike here and only one is a problem:

- **Asserting the name** — `expect(playButton).toHaveAttribute("aria-label", "Pause audio")`
  — is testing the accessibility contract. Keep it. That is the point of the attribute.
- **Finding an element by its name** — `page.getByLabel("Timeline slider").click()` — is
  using a translatable string as an ID. `data-part` exists for that.

This work fixes exactly one of them: the hardcoded selector in `rate-drag.spec.ts`, because
phase 3 deletes the label it depends on. Converting the other specs is worth doing and is
**not this feature's job** — bundling it would hide the localisation change inside a large
test diff. File it as a tests ticket.

## Verify

```
npx tsc --noEmit --project tsconfig.app.json
npx tsc --noEmit --project tsconfig.test.json
npx tsc --noEmit --project tsconfig.node.json
npx eslint .
npx prettier --check .
npx vitest run
node scripts/issues.mjs --check
```

The 68 English-string assertions across 17 `testJSDom` files should **not** move. They pin
the fallbacks — that no `labels` prop means no change — which is the property the no-merge
design exists to protect. One of them changing is a signal, not a chore.

Then packaging, which has bitten this project before:

```
npx tsup
head -c 20 dist/index.mjs
npx attw --pack . --profile esm-only --exclude-entrypoints styles.css
```

`dist/index.mjs` must still open with `"use client"` (**S3**).

E2E last: `npx vite dev` first, then
`npx playwright test --config playwright.local.config.ts`. Expect exactly one failure, in
phase 3, from the `RateDisplay` deletion, and fix it in that same commit. Any other failure
is a real regression.

**Re-measure P1-a after every phase**, the same way: rollup tree-shake of `dist/index.mjs`,
esbuild minify, gzip level 9. A `PlayButton`-only import is ~1,246 B today. It may grow by
the bytes of one optional read; it must not grow by the bytes of another component's
strings. If it jumps, something imported a shared defaults table, or `playerLabels.ts` used
a value import where it needed `import type` — which is the one thing this design exists to
prevent.

## Report

- The P1-a number after each phase, and what accounts for any movement
- Whether indexing `labels` by `config.labelKey` / `config.valueKey` type-checked without an
  assertion, and if not, where the cast had to go
- Whether one shared `SliderAriaState` payload held up for all three modes, or whether
  `rateValue`'s two dead fields turned out to be worse than a `switch`
- Whether the two-shape rule stayed as legible in the README as it is in the type, or whether
  consumers would be better served by uniform functions and a documented Server Component
  caveat
- Whether `Record<PlayerState, string>` produced a useful error for a missing state, or an
  unreadable one
- Whether any existing test asserted on an English string and had to move
- Whether `Time.Remaining`'s zero cases really can route through the entry, or whether a
  library-owned `"0:00"` survived somewhere
