# Labels and localisation

Every string the library renders or announces is overridable through one prop
on the root:

```jsx
<AudioPlayer track={{ src: "audio.mp3" }} labels={german}>
  {/* Player UI components */}
</AudioPlayer>
```

Every entry is optional, and one you leave out keeps its English default, so a
partial object is fine. The
[custom-components example](../examples/custom-components) is a whole player
in German, every entry in its `labels.ts`.

## Strings or functions

**A fixed set of states takes an object of strings. A number in the text takes
a function.** `<PlayButton>` has four states, so `play` is four strings;
`labels.seek` interpolates a number, so it is a function.

The string entries are plain data, so they can cross a React Server Component
boundary and come straight from a `de.json`. Only the function entries need a
`"use client"` module of your own.

The state keys are the values the components put on `data-state`, and
`Record<PlayerState, string>` makes a forgotten state a compile error.

## Entries

| Entry            | Type                                 | Default                                                                |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `player`         | `string`                             | `"audio player"`                                                       |
| `play`           | `Record<PlayerState, string>`        | "Play audio" / "Pause audio" / "Loading audio" / "Error loading audio" |
| `mute`           | `Record<VolumeState, string>`        | "Unmute" when muted, "Mute" otherwise                                  |
| `timeToggle`     | `({ time, shown }) => string`        | `"1:23 elapsed, show time remaining"`                                  |
| `seek`           | `({ amount }) => string`             | `"Seek forward by 10 seconds"`                                         |
| `rateSet`        | `({ rate }) => string`               | `"Set playback rate to 1.5x"`                                          |
| `rateChange`     | `({ amount }) => string`             | `"Increase playback rate by 0.25x"`                                    |
| `rateGroup`      | `string`                             | `"Playback rate options"`                                              |
| `timelineSlider` | `string`                             | `"Timeline slider"`                                                    |
| `volumeSlider`   | `string`                             | `"Volume slider"`                                                      |
| `rateSlider`     | `string`                             | `"Playback rate slider"`                                               |
| `timelineValue`  | `(state: SliderAriaState) => string` | `"Position 0:30 of 2:00"`                                              |
| `volumeValue`    | `(state: SliderAriaState) => string` | `"Muted, 80%"` / `"80%"`                                               |
| `rateValue`      | `(state: SliderAriaState) => string` | `"1.5x"`                                                               |
| `time`           | `({ seconds, part }) => string`      | `"1:30"`, `"-1:30"`; see [`time`](#time)                               |
| `rateDisplay`    | `({ rate }) => string`               | `"1.5x"`                                                               |

`player` names [`<PlayerRoot>`](accessibility.md#naming-the-player) when
`track` has no `title`. It is also set on the `<audio>` element, where it
is not announced.

`SliderAriaState` is `{ value, maxValue, muted }`, one payload for all three
sliders. The timeline reads `value` and `maxValue` as seconds, volume reads
`value` as `0`–`1` plus `muted`, and the rate slider reads `value` alone.
`value` is the same number as `aria-valuenow`: whole seconds for the timeline,
hundredths for the other two.

Function entries return `string`, never `string | undefined`, so TypeScript
refuses an entry that covers two states and falls off the end. At runtime an
entry that does return `undefined`, such as a translation library's missing
key, falls back to the English default.

## Format numbers with `Intl`

Entries receive raw numbers: `volumeValue` gets `0.8`, not `"80%"`, and
`rateDisplay` gets `1.5`, not `"1.5x"`. German writes "80 %" with a
non-breaking space and "1,5x" with a decimal comma, and `Intl` produces both if
it is handed the number:

```ts
const pf = new Intl.NumberFormat("de-DE", { style: "percent" });
volumeValue: ({ value, muted }) =>
  muted ? `Stumm, ${pf.format(value)}` : pf.format(value);
```

There is no separate number-formatting option.

## Precedence

A per-instance `aria-label` beats the `labels` entry, which beats the English
default:

```jsx
{
  /* "Abspielen", whatever labels.play says */
}
<PlayButton aria-label="Abspielen">▶</PlayButton>;
```

So `labels` is for the whole player and `aria-label` for the one control that
needs different wording.

## The state says what is; the name says what pressing does

Two entries read as inversions, and are not:

```ts
mute: { muted: "Ton einschalten" }, // state "muted", name "unmute"
timeToggle: ({ time, shown }) =>
  shown === "elapsed"
    ? `${time} vergangen, Restzeit anzeigen` // showing elapsed, will show remaining
    : `${time} verbleibend, vergangene Zeit anzeigen`,
```

`mute` has three states and two names, because `low` and `high` both mean
"audible, so pressing mutes".

`timeToggle` receives `time`, the readout's text exactly as shown, `labels.time`
included. Start the name with it, so a voice-control user can say what they
see.

## `time`

`seconds` is never negative. It is `0` while loading and `0` at the end, and
`part` says which readout is asking. **The library owns which number; you own
how it reads, sign included**, so an entry handling `"remaining"` writes its own
`-`:

```ts
const clock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

time: ({ seconds, part }) =>
  part === "remaining" && seconds > 0 ? `-${clock(seconds)}` : clock(seconds);
```

An entry that ignores `part` renders a plausible clock, but elapsed and
remaining come out identical, so a `<Time.Toggle>` looks dead.

Without a `time` entry, times read `M:SS`, or `H:MM:SS` from an hour up.

Overriding `time` does not change the timeline's `aria-valuetext`:
`timelineValue` formats its own two clocks from raw seconds. Keep one `clock()`
helper and call it from both.

### What `time` cannot do

It is keyed by `part`, not by instance, so two `<Time.Duration>` in one player
cannot differ, and formatting one readout means writing an entry that handles
all three. The readouts take no `children`, and no `format` prop.

For those cases, render your own `<time>`. `useTimeDisplay()` and `formatTime`
are exported so you do not re-derive the remaining clamp or the default clock:

```jsx
import { useTimeDisplay, formatTime } from "react-headless-audio-player";

function LongDuration() {
  const { remaining } = useTimeDisplay();
  // `remaining` is a magnitude, clamped at 0: the sign is yours, as in `time`.
  return <time>{remaining > 0 ? `-${formatTime(remaining)}` : "0:00"}</time>;
}
```

## With an i18n library

`labels` is read during render, and a new object re-renders every control,
which is all a locale switch needs. An inline literal is fine:

```jsx
const { t } = useTranslation();

<AudioPlayer
  track={{ src: "audio.mp3" }}
  labels={{
    play: {
      playing: t("player.pause"),
      paused: t("player.play"),
      loading: t("player.loading"),
      error: t("player.error"),
    },
    volumeValue: ({ value, muted }) =>
      t(muted ? "player.mutedAt" : "player.volume", { percent: value }),
  }}
>
```

With `exactOptionalPropertyTypes` on, an entry may be absent but not
present-and-`undefined`, so `labels={{ play: maybeUndefined }}` is an error:
leave the key out. The same applies to `shortcuts`.
