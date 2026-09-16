---
id: A15
title: "Every string is hardcoded English"
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: true
evidence: [code-reading, measured, verified]
---

Most `aria-label`s can be overridden via
props, but `aria-valuetext` is value-dependent (so a static prop cannot replace it) and
`ErrorMessage` accepts no props at all.

## Where it stands

Every string is hardcoded English, and there is no way to supply your own. **Needs design before implementation — this row is a problem statement, not a plan.** (1) **Entries must be functions, not strings.** `aria-valuetext` renders "Position 1:30 of 3:00" and "Muted, 80%", and `PlayButton` has four state-dependent names — a static `aria-label` flattens all four to one string, which is a broken translation rather than a worse one. The controls needing this are exactly the three **A4** toggles plus the sliders: A4 put state on the name, and that is what makes a string bag insufficient. (2) **Three number formats, not one** — `formatTime`, `` `${Math.round(v * 100)}%` `` and `` `${Math.round(v * 100) / 100}x` ``. Two of them sit _inside_ larger strings ("Muted, 80%"), so labels and number formatting cannot be separate options; one mechanism passing raw values, with `Intl` left to the consumer. This also settles the open half of **S16**: time formatting is an entry in the surface, not a `format` prop on `Time.Elapsed`. (3) **Reach is already complete** — every English string is overridable per instance _except_ `aria-label="audio player"`, where `{...props}` is spread before the attribute (`AudioElement.tsx:65-67`), unreachable through `audioProps`. That is a one-line fix independent of this. So the surface buys ergonomics and the state-dependent cases, not reach. (4) Where it lives — one prop on `AudioPlayer` with per-component override. Before committing, write the German values for `PlayButton`'s four states, "Muted, 80%" and `1,5x`: those three exercise function-shaped entries, a number inside a sentence, and the decimal separator.

## The reach half is shipped (2026-09-15)

Point (3) above — `aria-label="audio player"` being unreachable because
`{...props}` was spread before it — is fixed. The label sits before the spread,
so `audioProps={{ "aria-label": "…" }}` replaces it, and every English string in
the library is now overridable per instance. Pinned by a row in
`AudioElement.test.tsx`.

That was the one-line fix this ticket called independent of the design. The rest
of the ticket — function-shaped entries, the three number formats, where the
surface lives — is settled below and now shipped.

## The design (2026-09-16)

Settled. The plan is `plans/PLAN-localisation-surface.md`; this is the decision and the
reasoning, so the ticket stands on its own.

**Two corrections to the opening paragraph first.**

`ErrorMessage` is no longer part of this. **S16** shipped: it takes the full
`HTMLAttributes` bag, and its text has always been the consumer's `children`, so there is no
English string in it.

And point (1) is half right. It concludes "entries must be functions" from an argument that
only supports "entries must be **independent strings** rather than one template" — see
[the shape](#the-shape) below. Functions are needed where a number is interpolated, which is
half the surface, not all of it.

### What is left

17 strings, in three tiers. One is deleted rather than localised, so the surface is
**16 entries**:

| tier                          | where                                                                                             | can a per-instance `aria-label` replace it?          |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **1 — state-dependent names** | `PlayButton` ×4, `MuteButton` ×2, `Time.Toggle` ×2                                                | **No** — a static string flattens four states to one |
| **2 — value-dependent text**  | three `aria-valuetext`, the three `<time>` readouts, `RateDisplay`'s text                         | **No** — it changes with the value                   |
| **3 — static / prop-derived** | `"audio player"`, three slider labels, `"Playback rate options"`, `SeekButton`, `.Set`, `.Change` | **Yes** — already overridable today                  |
| **deleted, not localised**    | `"Current playback rate"` on `RateDisplay`                                                        | — see below                                          |

Tiers 1 and 2 are the defect. Tier 3 works, and is the ergonomics half: a German app writes
`aria-label` at seven-plus call sites and silently keeps English wherever someone forgets
one.

### `RateDisplay`'s name is deleted, not translated

`SetPlaybackRate.tsx:120-130` renders `<span data-part="rate-display" aria-label="Current
playback rate">{roundedRate}x</span>`. That is the pattern **A12** removed from `Time.*`,
and its resolution says why: "naming a generic element is not reliably announced, so the
label was **as likely to be dropped as to hide the value**." A `<span>` is `role="generic"`
too, so the attribute either vanishes or replaces "1.5x" with a phrase that names the widget
and withholds the number. Translating it buys a string that fails to be announced in German.

So it goes, with no `rateDisplayLabel` entry — the text is the name, as A12 concluded for the
clocks, and `data-part="rate-display"` remains the query hook. The result is symmetric:
`Time.*` has `time` and no name entry, `RateDisplay` has `rateDisplay` and no name entry.
Breaking in the same narrow sense A12 was, and one E2E spec of ours
(`rate-drag.spec.ts:78`) relies on it.

### The shape

A `labels` prop on `AudioPlayer` carried by `PlayerConfigContext` — already exactly "static
props flowing strictly downward, neither state nor a projection of the element".
Per-instance override needs no new plumbing: every `"aria-label"` in the props bags sits
_before_ `...props`. Precedence is per-instance `aria-label` → `labels` entry → the English
default.

**One rule decides every entry's shape: a fixed set of states takes an object of strings; a
number in the text takes a function.**

Point (1) is right that German defeats a template. `loading` is "Audio wird geladen", a
passive construction; `paused` is "Audio abspielen", an infinitive. No swapped verb produces
both. But what that proves is **four independent strings**, and an object of four strings is
four independent strings:

```ts
play: {
  playing: "Audio pausieren",
  paused:  "Audio abspielen",
  loading: "Audio wird geladen",
  error:   "Fehler beim Laden des Audios",
}
```

A function is unavoidable only where a number is interpolated — "Stumm, 80 %", "1,5x",
"Position 1:30 von 3:00", "10 Sekunden vorspulen". Eight entries are data, eight are
functions.

Keeping half the surface as data buys three things over uniform functions:

- **It works from a React Server Component.** React refuses to pass a function across that
  boundary. The library ships `"use client"` precisely so the App Router works — **S3** was a
  P0 — and an all-function `labels` would mean adding German forces a client boundary that
  rendering the player today does not.
- **It matches how translations are stored.** A `de.json` drops straight in.
- **The compiler still catches a missing state.** `Record<PlayerState, string>` requires all
  four keys.

The cost is two entries that read as self-contradictory — `mute: { muted: "Ton
einschalten" }` — because the state says what _is_ and the name says what _pressing does_.
Documented rather than designed away; a line that looks wrong gets checked, a ternary slides
past.

**State-dependent entries are keyed by the component's `data-state` value** — `PlayerState`,
`VolumeState`, `TimeDisplayState`. Those three sets already ship as attributes and are
already documented as stable API (`README.md:326-328`). One vocabulary in two places. It also
explains `mute` having three keys for two names: `low` and `high` both mean "audible, so
pressing mutes".

**Function entries return `string`, never `string | undefined`.** The likeliest bug on this
surface is a function covering two of four states and returning nothing for the rest — a
German app saying "Loading audio" while buffering, with no error. `=> string` makes that a
compile error. At runtime a function that does return `undefined` still falls through the
`??` to English, which is worth documenting and worth keeping out of the type, since putting
it there switches the check off.

**Entries receive raw values, never preformatted substrings.** Point (2). German writes
"80 %" with a non-breaking space and "1,5x" with a decimal comma;
`Intl.NumberFormat("de-DE", { style: "percent" }).format(0.8)` and
`Intl.NumberFormat("de-DE").format(1.5)` produce both. Hand the entry a finished `"80%"` and
the consumer's only recourse is string surgery.

**No central defaults module, and so no merge step.** The constraint this ticket did not
name, and the one most likely to bite. **P1-a** measured this exact symptom: a
`PlayButton`-only bundle contained `"Volume slider"` and `"Timeline slider"`. A
`defaultLabels` object imported by `AudioPlayer` — or by any merge helper — drags every
string back into every bundle and undoes the 4,025 B → 1,137 B win already paid for.

The answer is a `Partial` in the context, with each component keeping its own literal as the
fallback:

```ts
"aria-label": labels?.play?.[playerState] ?? ariaLabelMap[playerState],
```

No merge, no defaults module, partial override free, every string in the one module that
uses it — and a lookup rather than a call, which is strictly simpler than the function form.
`useLabels()` adds nothing to any bundle either: it reads `PlayerConfigContext`, already in
every control's import graph via `useComposedButtonProps` → `useHandleMediaKeys` →
`usePlayerConfig`. The one trap is that the new types module must use `import type` for
`SliderAriaState` — `sliderModes.ts` also holds `SLIDER_MODES`, and a value import there
re-breaks P1-a invisibly.

### The 16 entries

| shape                 | entries                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **plain string**      | `player`, `rateGroup`, `timelineSlider`, `volumeSlider`, `rateSlider`                               |
| **object of strings** | `play`, `mute`, `timeToggle`                                                                        |
| **function**          | `seek`, `rateSet`, `rateChange`, `timelineValue`, `volumeValue`, `rateValue`, `time`, `rateDisplay` |

The slider keys pair mechanically — a name ends in `Slider`, its spoken value ends in
`Value` — so guessing one gives the other. That matters more than description in a
sixteen-key object; an earlier draft had `volumeLevel` beside `timelinePosition` and
`ratePosition`, where nothing tells you which word to try.

### Decisions inside that

- **The full bag (16 entries), not the narrow one (7).** A narrow bag — only what a static
  prop cannot express — is smaller, but then a German app localises through two mechanisms
  and keeps English wherever it misses one. Every entry is optional, so the extra nine cost
  nothing.
- **Object parameters for the functions, not positional.** `SliderAriaState` already sets the
  precedent, and an object can gain a field without a breaking change.
- **One payload for all three slider value entries**, `SliderAriaState` — already the shape
  `ariaValueText` takes. Indexing `labels` by a union of keys yields a union of function
  types, and TypeScript will not call one whose parameters differ; separate payloads would
  force a three-way `switch` in `useSlider` that `SLIDER_MODES` exists to avoid. `rateValue`
  ignoring `maxValue` and `muted` is the price. The three slider _names_ are plain strings, so
  they index trivially.
- **`time` does not feed the timeline's `aria-valuetext`.** `timelineValue` gets raw seconds
  for both ends and formats them itself. Cross-referencing entries would force a
  merge-then-bind pass, which is the module ruled out above. A consumer writes one local
  `clock()` helper and calls it from both.
- **`time` takes a magnitude plus `part: "elapsed" | "remaining" | "duration"`**, not a signed
  number. The division is: the library owns **which number** — `0` while loading, `0` at the
  end, never negative — and the consumer owns **how it reads, sign included**. A signed number
  would force `formatTime` to grow negative handling, whose current job is the opposite.

  This is the surface's one quiet failure mode. `Time.Elapsed` and `Time.Remaining` render
  into the same slot and exactly one shows, so `time: ({ seconds }) => clock(seconds)`
  type-checks, renders a plausible clock, and makes the two readouts identical — leaving
  `Time.Toggle` looking dead, with a missing hyphen as the only symptom. The README carries a
  worked `remaining` example for that reason.

- **No entry ever receives a non-finite number.** `duration` is `NaN` before metadata and
  `Infinity` for a live stream, but the store normalises on write (`syncFromElement.ts:78-80`),
  so every atom feeding a readout is already finite and ≥ 0.
- **This settles the open half of S16**: time formatting is an entry here, not a `format` prop
  on `Time.Elapsed`.

### Refused

**A `t(key, params)` function** with a discriminated-union request, returning `undefined` to
fall back. It adapts to an existing i18n stack in a few lines, but it is the same 16 shapes in
a less discoverable form — a `switch` where an object literal would do — and it is a function,
so it carries the Server Component restriction across the whole surface rather than half of it.
The object form adapts just as cleanly:
`labels={{ play: { playing: t("player.playing"), … } }}` reads `t` from the render scope,
so a locale change re-renders every control.

**Documenting the props-hook workaround and shipping nothing.** Tier 1 is already solvable —
`const bag = usePlayButtonProps(); <button {...bag} aria-label={t(bag["data-state"])} />`
works today. Tier 2 is not: `useSlider` is unexported, so the consumer recomputes
`aria-valuetext` from `useAudioPlayer()` and re-derives the **A13** quantization by hand, and
when they get it wrong `aria-valuetext` and `aria-valuenow` drift with nothing to catch it.

**Shipping locale bundles.** Translation maintenance on a headless library, and it still
cannot match a consumer's tone.

### The German check this ticket asked for

Phase 4 of the plan turns these into a fixture — and only these. The mechanism tests cover
payloads, fallbacks and precedence; a German string that renders identically to the English
one would assert that the code ran, not that it was right.

|                  | English                                                        | German                                                                                    | what it proves                                         |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `PlayButton` ×4  | Pause audio / Play audio / Loading audio / Error loading audio | Audio pausieren / Audio abspielen / **Audio wird geladen** / Fehler beim Laden des Audios | four independent constructions — no single string fits |
| volume valuetext | `Muted, 80%`                                                   | `Stumm, 80 %` (U+00A0)                                                                    | a number inside a sentence, with locale spacing        |
| rate valuetext   | `1.5x`                                                         | `1,5x`                                                                                    | decimal separator — the entry needs `1.5`, not `"1.5"` |

Row one defeats a **single-string** `aria-label`; it does not defeat an object of four
strings, which is why `play` is one. Rows two and three are what require functions.

### Also required to ship

- Export `PlayerLabels` and `TimePart` from `index.ts`. Without them an inline
  `labels={{ … }}` infers fine but `const german: PlayerLabels = { … }` — one object per
  language, the common case — cannot be written down.
- Rename the store's `TimeDisplay` type to `TimeDisplayState` and export it. `timeToggle`'s
  keys need a nameable type, `PlayerState` and `VolumeState` are already exported and this one
  was missed, and `TimeDisplay` as a public name reads like a component beside the `Time`
  namespace — `TimeDisplay.tsx:14` already imports it `as TimeDisplayState` for that reason.
- Fix `testE2E/PlaybackRate/rate-drag.spec.ts:78`, which finds the rate display by the
  `aria-label` this ticket deletes. Locate by `[data-part="rate-display"]` instead. The wider
  problem — ~10 E2E specs locating elements by English `aria-label` via the fixture at
  `test-utils.ts:218` — is **T12**, not this ticket.

## Resolution

**Shipped (2026-09-16)** — `AudioPlayer` takes a `labels` prop: 16 optional entries covering
every name and readout the library writes, landed in the four phases the plan set out. The
design above is what shipped, unchanged.

**The shape held.** Eight entries are objects of strings keyed by the component's
`data-state` value, eight are functions receiving raw numbers. Nothing needed a cast:
`labels?.[config.labelKey]` and `labels?.[config.valueKey]?.(ariaState)` both index cleanly
through `SLIDER_MODES`, which is the payoff for giving all three value entries one
`SliderAriaState`. `SliderAriaState` is now exported, alongside `PlayerLabels`, `TimePart`
and the renamed `TimeDisplayState`.

**No merge step, and the bundle proves it.** Each component keeps its own English literal as
the `??` fallback, so there is no defaults module to drag strings into bundles that do not
use them. A `PlayButton`-only import measured **1,242 B → 1,267 B gzipped**, +25 B for the
optional read, and held flat at 1,267 B across phases 2 and 3 — a `PlayButton` bundle still
contains none of the slider, rate or time vocabulary. That is the property **P1-a** paid for
and the one a shared `defaultLabels` object would have undone.

**`RateDisplay`'s `aria-label="Current playback rate"` is deleted, not translated** — the
one breaking change here, in the same sense **A12** was. A `<span>` is `role="generic"`, so
the attribute was either dropped or replacing "1.5x" with a phrase that names the widget and
withholds the number. The text is the name now, exactly as A12 concluded for the clocks, and
`data-part="rate-display"` remains the query hook. Four jsdom assertions and one E2E spec
located the span by that label and now locate it by `data-part`.

**`PlaybackRate` no longer renders outside a player.** It reads `labels.rateGroup`, so it
throws like every other export does — the contract `AudioPlayer`'s JSDoc already stated. One
jsdom test rendered it bare and now renders it in the providers, with a row pinning the
throw.

### The German fixture

`testJSDom/labels/german.test.tsx`, and only the three rows the table above lists — the
mechanism is covered by the other three files in `testJSDom/labels/`. All three pass, and
each fails under a design this ticket rejected:

- **`Audio wird geladen` beside `Audio abspielen`** — a passive and an infinitive, so no
  template with a swapped verb produces the set. This is what defeats a single-string
  `aria-label`.
- **`Stumm, 80 %`** with U+00A0, asserted as an explicit escape rather than by calling `Intl`
  in the expectation too. Only reachable because the entry receives `0.8`.
- **`1,5x`** — the decimal comma, which needs `1.5` rather than `"1.5"`.

### What else moved

- **README** gained a `## Localisation` section after `## Accessibility`: the full 16-entry
  table, the one rule and why (a `de.json` drops in, and the data half crosses a Server
  Component boundary), the raw-values rule, the precedence, both inversions spelled out, the
  `time` sign with a worked `remaining` example, the note that overriding `time` does not
  reach `timelineValue`, and the `react-i18next` shape. The accessibility section's "pass
  your own `aria-label` to override any of them" and the `data-part` styling advice now point
  here, and `RateDisplay`'s "Named 'Current playback rate'" line is gone.
- **JSDoc** on every component whose name is now overridable, on the `export const` root.
- **S16**'s open half is settled: time formatting is `labels.time`, not a `format` prop.
- 53 tests in `testJSDom/labels/`. None of the existing English-string assertions moved
  except the four `RateDisplay` locators above — the fallbacks are unchanged, which is what
  the no-merge design exists to protect.

**Not in scope, filed as T12** — roughly ten E2E specs _locate_ elements by English
`aria-label` through the fixture at `test-utils.ts:218`. Asserting a name is testing the
contract and stays; finding an element by one is using a translatable string as an ID.
Converting them would have buried this public-API change in a large test diff.
