# React Headless Audio Player

A headless, accessible audio player for React: compound components that give you
behaviour, semantics and state, while you supply all of the markup and styling.
For the parts you would rather build yourself, each button also ships as a props
hook.

**Beta.** Published under the `beta` dist-tag until 1.0, and the API can change
between betas. Every change is listed in the [changelog](CHANGELOG.md).

There is no `asChild`. Radix's merge rule is child-props-win, which would invert
every lock this library spreads last — `role="slider"`, `tabIndex={-1}`,
`aria-hidden`, the `aria-disabled` click gate — and naming a `Slot` would cost
bundle size for consumers who never use it. The [props hooks](#props-hooks) cover
the same ground without either.

## Features

- 🎨 Unstyled — every part takes your own `className` and `style`
- 🧩 Compound components, placed anywhere in your own layout
- 🪝 A props hook behind every button, for markup you already own
- 🎯 `data-part` on every part, and `data-state` where the DOM does not say it
- 🎛️ Play/pause, mute, seek, volume and playback rate
- ⌨️ Keyboard shortcuts, ARIA slider semantics and screen reader announcements
- 🔒 Lock screen, media keys and notification controls through `<MediaSession>`
- ✔️ No dependencies beyond React 18

## Basic usage

```jsx
import {
  AudioPlayer,
  PlayButton,
  Timeline,
  Volume,
} from "react-headless-audio-player";

function App() {
  return (
    <AudioPlayer audioFile={{ src: "audio-file.mp3" }}>
      <Timeline>
        <Timeline.Control>
          <Timeline.Progress />
        </Timeline.Control>
        <Timeline.Thumb />
      </Timeline>

      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>

      <Volume>
        <Volume.Control>
          <Volume.Progress />
        </Volume.Control>
        <Volume.Thumb />
      </Volume>
    </AudioPlayer>
  );
}
```

## Accessibility

Each slider exposes one focusable `role="slider"` element that carries the
`aria-value*` attributes and takes the arrow keys, plus `Home` and `End`. The
drag thumbs are pointer affordances only: they are `aria-hidden` and out of the
tab order, so a slider announces one value rather than two.

A slider root is a plain `<div>` with no role of its own. The parts inside it
are the slider, its fill and its thumb — one control, already named — so a
wrapper role would announce a group of one. `<PlaybackRate>` is the exception
and keeps `role="group"`, because it wraps several buttons. If you compose other
controls into a slider root, add your own `role="group"` and `aria-label`; props
are spread through.

`<AudioPlayer>` itself renders no element, so nothing names or bounds the
player as a whole: two players on a page announce identically. Wrap your
controls in `<PlayerRoot>` and each player becomes a named landmark:

```jsx
<AudioPlayer audioFile={track}>
  <PlayerRoot className="player">
    <PlayButton>…</PlayButton>
    <Timeline>…</Timeline>
  </PlayerRoot>
</AudioPlayer>
```

It renders a `<div data-part="player">` with `role="region"`, a name from
`labels.player` (or pass `aria-labelledby` pointing at the track title),
`tabIndex={-1}` and the keyboard shortcuts. The `-1` means a click on the cover or the title focuses
the player, so the shortcuts keep working, without adding a tab stop: keyboard
users reach it through its controls, and no focus ring appears on a click. For
a container of your own — a `<section>`, or one another component library
renders — spread `usePlayerRootProps()` onto it instead. Both are opt-in:
`<AudioPlayer>` will not render a wrapper itself, since one would break every
layout composed around it rendering nothing.

The volume slider announces the mute as well as the volume — "Muted, 80%" — since
the two are separate on the element and the arrow keys change the volume without
unmuting.

Each control says its state in exactly one place.

For the three toggles that is the **name**, which changes with the state:
`<MuteButton>` is "Mute" or "Unmute", `<PlayButton>` is "Play audio", "Pause
audio", "Loading audio" or "Error loading audio", and `<Time.Toggle>` is "1:23
elapsed, show time remaining" — it starts with the time on screen, so a
voice-control user can say what they see (WCAG 2.5.3). None of them sets `aria-pressed` — a
name that already says which way the toggle will go, plus a pressed state saying
it has already gone, announces as a contradiction ("Unmute, toggle button,
pressed").

For `<PlaybackRate.Set>` it is **`aria-pressed`**, because its name does not
move: "Set playback rate to 1.5x" reads the same whether or not that rate is in
effect, so the name has no state to carry. The rate in effect is
`aria-pressed="true"` and the others are `"false"` rather than absent, so the
row announces as a set of choices rather than as unrelated buttons.

Every string quoted above is English only until you say otherwise. Translate the
lot with [`labels`](#localisation), or one control at a time with your own
`aria-label`.

Your handlers run alongside the library's rather than replacing them — yours
first, ours second, and `preventDefault()` in yours opts out of ours. On a
`<button>` that also cancels `Enter` and `Space` activation, so scope it to the
key you are handling; to turn a media shortcut off, unbind it with
`customKeyboardShortcuts` instead.

An unavailable control is marked `aria-disabled` and does nothing when
activated, your own `onClick` included — so style that state from
`[aria-disabled="true"]`, never `:disabled`. The native attribute is deliberately
unused: it takes the control out of the tab order, so a `src` swap under a
focused control would drop focus to `<body>`.

**Loading does not make a control unavailable.** `play()`, the volume, the mute
and the rate all work before metadata arrives, and a track change re-enters
loading, so disabling there would swallow the first press on every playlist
advance. An error disables everything; missing a duration disables only the
timeline and the seek buttons, which are the two things that have to name a
position on the track; and a browser that ignores `volume` writes, which is
iOS, disables only the volume slider.

Errors render into a live region. Every control also accepts the global media
shortcuts while focused, whether or not it is disabled: the shortcuts belong to
the player, not to the control. A slider's own arrow keys are the exception —
those stop while it is disabled.

**These promises hold for the components.** The [props hooks](#props-hooks) hand
you the same attributes and let you decide where they go, so spreading the bag
before your own props — or onto something that is not a `<button>` — can defeat
the disabled gate or the semantics. Spread it last, onto a `<button>`, and you
get everything above.

## Localisation

Every string the library speaks is overridable, through one prop on the root:

```jsx
<AudioPlayer audioFile={{ src: "audio.mp3" }} labels={german}>
  {/* Player UI components */}
</AudioPlayer>
```

Every entry is optional, and one you leave out keeps its English default — so a
partial bag is fine, and passing no `labels` at all changes nothing.

### One rule, two shapes

**A fixed set of states takes an object of strings. A number in the text takes a
function.**

Nothing else decides it. `<PlayButton>` has four states, so `play` is four
strings; `labels.seek` interpolates a number nobody can write down in advance,
so it is a function.

Keeping half the surface as plain data buys two things. It survives a **React
Server Component** boundary — React refuses to pass a function from a server
component to a client one — so only an app that needs the function entries needs
a `"use client"` of its own. And it matches how translations are stored: a
`de.json` drops straight in, where a function is glue you have to write.

The state keys are the same values the components put on `data-state`, so it is
one vocabulary in two places, and `Record<PlayerState, string>` makes a forgotten
state a compile error rather than a silently English name.

### Entries get raw numbers

`volumeValue` receives `0.8`, not `"80%"`. `rateDisplay` receives `1.5`, not
`"1.5x"`. German writes "80 %" with a non-breaking space and "1,5x" with a
decimal comma, and `Intl` produces both correctly — but only if it is handed the
number:

```ts
const pf = new Intl.NumberFormat("de-DE", { style: "percent" });
volumeValue: ({ value, muted }) =>
  muted ? `Stumm, ${pf.format(value)}` : pf.format(value);
```

That is also why there is no separate number-formatting option: one mechanism,
raw values, `Intl` is yours.

### The table

| Entry        | Type                          | Default                                                                |
| ------------ | ----------------------------- | ---------------------------------------------------------------------- |
| `player`     | `string`                      | `"audio player"`                                                       |
| `play`       | `Record<PlayerState, string>` | "Play audio" / "Pause audio" / "Loading audio" / "Error loading audio" |
| `mute`       | `Record<VolumeState, string>` | "Unmute" when muted, "Mute" otherwise                                  |
| `timeToggle` | `({ time, shown }) => string` | `"1:23 elapsed, show time remaining"`                                  |
| `seek`       | `({ amount }) => string`      | `"Seek forward by 10 seconds"`                                         |
| `rateSet`    | `({ rate }) => string`        | `"Set playback rate to 1.5x"`                                          |
| `rateChange` | `({ amount }) => string`      | `"Increase playback rate by 0.25x"`                                    |

`player` names [`<PlayerRoot>`](#accessibility) — see
[Accessibility](#accessibility). It is also set on the `<audio>` element, which
has no accessible object without `controls`, so it is not announced there.
| `rateGroup` | `string` | `"Playback rate options"` |
| `timelineSlider` | `string` | `"Timeline slider"` |
| `volumeSlider` | `string` | `"Volume slider"` |
| `rateSlider` | `string` | `"Playback rate slider"` |
| `timelineValue` | `(state: SliderAriaState) => string` | `"Position 0:30 of 2:00"` |
| `volumeValue` | `(state: SliderAriaState) => string` | `"Muted, 80%"` / `"80%"` |
| `rateValue` | `(state: SliderAriaState) => string` | `"1.5x"` |
| `time` | `({ seconds, part }) => string` | `"1:30"`, `"-1:30"` — see [what `time` cannot do](#what-time-cannot-do) |
| `rateDisplay` | `({ rate }) => string` | `"1.5x"` |

`SliderAriaState` is `{ value, maxValue, muted }` — one payload for all three
sliders, so each uses what it needs. The timeline reads `value` and `maxValue` as
seconds, volume reads `value` as 0–1 plus `muted`, and the rate slider reads
`value` alone. `value` is the same number as `aria-valuenow`: quantized to whole
seconds for the timeline and to hundredths for the other two, so the announced
value and the spoken text cannot drift apart.

Function entries return `string`, never `string | undefined`. A half-written
entry that covers two states and falls off the end is the likeliest bug here, and
that signature is what makes TypeScript refuse it. At runtime an entry that does
return `undefined` — a translation library with a missing key — falls back to the
English default rather than dropping the name.

### Precedence

A per-instance `aria-label` beats the `labels` entry, which beats the English
default:

```jsx
{
  /* "Abspielen", whatever labels.play says */
}
<PlayButton aria-label="Abspielen">▶</PlayButton>;
```

So `labels` is for the whole player and `aria-label` for the one control that
needs different wording. Both are reasons to select on
[`data-part`](#styling) rather than on a name.

### Two entries read as inversions

They are not. **The state says what _is_; the name says what _pressing does_.**

```ts
mute: { muted: "Ton einschalten" }, // state "muted", name "unmute"
timeToggle: ({ time, shown }) =>
  shown === "elapsed"
    ? `${time} vergangen, Restzeit anzeigen` // showing elapsed, will show remaining
    : `${time} verbleibend, vergangene Zeit anzeigen`,
```

`mute` also has three states and two names, because `low` and `high` both mean
"audible, so pressing mutes". That is what the `data-state` attribute has, and
the keys follow it.

`timeToggle` receives `time`, the readout's text exactly as shown, `labels.time`
included. Start the name with it: a voice-control user says what they see.

### `time` receives a magnitude, and you write the sign

`seconds` is never negative. It is `0` while loading and `0` at the end, and
`part` tells you which readout is asking. **The library owns which number; you
own how it reads, sign included** — so an entry handling `"remaining"` has to
write its own `-`:

```ts
const clock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

time: ({ seconds, part }) =>
  part === "remaining" && seconds > 0 ? `-${clock(seconds)}` : clock(seconds);
```

An entry that ignores `part` type-checks and renders a plausible clock, but
elapsed and remaining come out identical — so a `<Time.Toggle>` looks dead. The
only symptom is a missing hyphen.

### What `time` cannot do

It is keyed by `part`, not by instance, so the three readouts get three
renderings per player. Two `<Time.Duration>` in one player cannot differ, and
formatting one readout means writing an entry that handles all three — there is
no "format the duration, leave the rest alone".

The readouts also do not take `children`. The text is what they render, so
passing your own is a compile error rather than something silently dropped.

For those cases, render your own `<time>`. `useTimeDisplay()` and `formatTime`
are exported so you do not have to re-derive the remaining clamp or reimplement
the default clock:

```jsx
import { useTimeDisplay, formatTime } from "react-headless-audio-player";

function LongDuration() {
  const { remaining } = useTimeDisplay();
  // `remaining` is a magnitude, clamped at 0 — the sign is yours, as in `time`.
  return <time>{remaining > 0 ? `-${formatTime(remaining)}` : "0:00"}</time>;
}
```

Overriding `time` does not change the timeline's `aria-valuetext`:
`timelineValue` formats its own two clocks from raw seconds. Keep one local
`clock()` helper and call it from both.

### With an existing i18n stack

`labels` is read during render and every control subscribes to the player's
config, so a new object re-renders all of them — which is all a locale switch
needs:

```jsx
const { t } = useTranslation();

<AudioPlayer
  audioFile={{ src: "audio.mp3" }}
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

Nothing memoises on the object's identity, so an inline literal is fine.

One TypeScript note if you have `exactOptionalPropertyTypes` on: an entry may be
absent, but it may not be present-and-`undefined`. So
`labels={{ play: maybeUndefined }}` is an error — pass `{}`, or leave the key
out. The same already applies to `customKeyboardShortcuts`.

## Components

### `<AudioPlayer>`

The root. Creates the store, renders the `<audio>` element, and provides both to
everything below it.

```jsx
<AudioPlayer audioFile={{ src: "audio.mp3" }}>
  {/* Player UI components */}
</AudioPlayer>
```

| Prop                      | Type                    | Description                                                                                                                      |
| ------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `audioFile`               | `AudioFile`             | The track to play. Required.                                                                                                     |
| `onEnded`                 | `() => void`            | Called once when the track finishes, with the element parked at the end. In Firefox only, a paused seek to the end fires it too. |
| `customKeyboardShortcuts` | `KeyToActionMap`        | Merged over the defaults, so a key you do not name keeps its default binding; `null` unbinds one.                                |
| `labels`                  | `PlayerLabels`          | Your own strings, for every name and readout. Every entry optional — see [Localisation](#localisation).                          |
| `audioProps`              | `AudioHTMLAttributes`   | Forwarded to the underlying `<audio>`. Excludes `src` and `onEnded`, which have dedicated props.                                 |
| `audioRef`                | `Ref<HTMLAudioElement>` | A ref to the `<audio>` element itself.                                                                                           |

```ts
type AudioFile = {
  src: string;
  // A live stream: no timeline, seeking or remaining time. Needed for MP3 and
  // Opus streams in Firefox; see "Live streams in Firefox".
  live?: boolean;
  // Shown on the lock screen and the system media controls by <MediaSession>.
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
};
```

#### Reaching the `<audio>` element

Anything the library does not model goes through `audioProps`, and `<track>`
captions through its `children`:

```jsx
<AudioPlayer
  audioFile={{ src: "audio.mp3" }}
  audioProps={{
    preload: "none",
    // Required for Web Audio — without it `createMediaElementSource` taints.
    crossOrigin: "anonymous",
    children: <track kind="captions" src="captions.vtt" srcLang="en" default />,
  }}
  audioRef={audioRef}
>
  {/* Player UI components */}
</AudioPlayer>
```

Use `audioRef` for anything that needs the element itself: Web Audio or
HLS.js/dash.js. Prefer a stable ref — an inline
callback re-runs the forwarding effect on every render.

One format is loaded per track. `<source>` fallback is planned, and will widen
the type rather than change it:

```ts
type AudioSource = { src: string; type?: string };
type AudioFile = AudioSource | { sources: AudioSource[] };
```

Everything passing `{ src }` today keeps working unchanged.

#### Playlists

The player holds one track. Keep the list and the index in your own state and
advance it from `onEnded`. Swapping `audioFile` reloads the element and
re-primes every value the player exposes.

```jsx
const tracks = [{ src: "one.mp3" }, { src: "two.mp3" }];

function Playlist() {
  const [index, setIndex] = useState(0);

  return (
    <AudioPlayer
      audioFile={tracks[index]}
      onEnded={() => setIndex((i) => Math.min(i + 1, tracks.length - 1))}
    >
      {/* Player UI components */}
    </AudioPlayer>
  );
}
```

The player carries on across a swap. If it was playing, the new track starts by
itself; if the user paused it, it stays paused. A track that ran to its end
counts as playing: the content stopped, not the listener. So this playlist plays
through, and Previous after the last track plays too, whenever it is pressed. A
track that fails to load does not stop the list; a browser that refuses
autoplay does. Next and previous buttons only change the index.

For a player that should rest at the end — a new `src` that is not navigation,
such as a refreshed signed URL, should arrive paused — call `pause()` from
`useAudioPlayer()` when `onEnded` does not advance. A pause ends the carry-on.

To start a track from a paused player — a click in a track list — call `play()`
in the same handler as the change. The order does not matter; the player
remembers the request across the swap:

```jsx
// Rendered inside the player, where useAudioPlayer() is available.
function TrackButton({ index, title, select }) {
  const { play } = useAudioPlayer();
  const playTrack = () => {
    select(index);
    play();
  };
  return <button onClick={playTrack}>{title}</button>;
}
```

The [playlist example](https://heinerbehrends.github.io/react-audio-player/#playlist)
does all three.

In Firefox, dragging the timeline to the very end while paused also fires
`onEnded`, so a user can advance this playlist by hand; Chrome does not. The next
track arrives paused, since nothing was playing.

### Timeline

`<Timeline step={5}>` is the root and takes an optional arrow-key step in
seconds; its maximum is the track duration, so it takes no `maxValue`.

- `<Timeline.Control>` — the focusable slider: click to seek, arrow keys to step
- `<Timeline.Progress>` — the filled part of the track
- `<Timeline.Background>` — the track behind the fill
- `<Timeline.Thumb>` — the draggable thumb

`.Control` is required, on every slider: it is the element that carries the
role, takes the keys and measures the track, so a root without one renders and
does nothing. In development the root logs an error for it after mount. That
check sits behind `process.env.NODE_ENV !== "production"`, the package's only
such branch; bundlers replace it with a literal and drop the code, exactly as
they do for React's own warnings, so a setup that runs React's development
build runs this too.

### Playback controls

- `<PlayButton>` — toggles play and pause
- `<PlayButton.Playing>` — renders its children while playing
- `<PlayButton.Paused>` — renders its children while not playing
- `<MuteButton>` — toggles mute
- `<MuteButton.Muted>` — renders its children while muted
- `<MuteButton.LowVolume>` — renders its children below half volume
- `<MuteButton.HighVolume>` — renders its children at or above half volume
- `<SeekButton amount={10}>` — jumps by `amount` seconds; negative rewinds

### Volume

`<Volume orientation="horizontal | vertical">` is the root. A vertical slider
runs bottom to top.

- `<Volume.Control>` — the focusable slider: click to set, arrow keys to step
- `<Volume.Progress>` — the filled part of the track
- `<Volume.Background>` — the track behind the fill
- `<Volume.Thumb>` — the draggable thumb

Reaching zero mutes, by any route — drag, click, keyboard or `setVolume(0)`.
Unmuting restores the volume the player was last audible at.

**On iOS the slider is disabled.** Apple keeps the level under the hardware
buttons: `HTMLMediaElement.volume` ignores writes and always reads `1`, so the
slider would move nothing. `<Volume.Control>` renders `aria-disabled` there,
and [`useIsVolumeAvailable()`](#useisvolumeavailable) lets you leave `<Volume>`
out and keep `<MuteButton>`, which still works.

### Time display

- `<Time.Elapsed>` — position
- `<Time.Remaining>` — time left, as `-1:30`
- `<Time.Duration>` — track length
- `<Time.Toggle>` — a button showing elapsed or remaining time, switching on
  press. `defaultValue="remaining"` starts it on remaining; the default is
  elapsed. It renders its own readout, so it takes no children.

```jsx
<Time.Toggle defaultValue="remaining" /> / <Time.Duration />;
```

Each readout always shows its own number, so a player that only ever shows the
time left renders `<Time.Remaining />` and no toggle. Each toggle keeps its own
choice. On a button of your own, `useTimeToggleProps(defaultValue)` gives you
the toggle's props; render `<Time.Elapsed />` or `<Time.Remaining />` inside it
from its `data-state`. Pass no `data-state` of your own: it replaces the bag's,
which then no longer says which readout is showing.

No `format` prop on the readouts: the formatting is `labels.time`, which names
all three at once and receives raw seconds. See
[`time` receives a magnitude](#time-receives-a-magnitude-and-you-write-the-sign).

### Playback rate

- `<PlaybackRate>` — groups the rate controls. Like every other export it must
  be rendered inside an `<AudioPlayer>`, and throws outside one — worth knowing
  if you render it bare in a story or a snapshot test
- `<PlaybackRate.Display>` — the current rate
- `<PlaybackRate.Set rate={1.5}>` — sets that rate
- `<PlaybackRate.Current rate={1.5}>` — marks that rate as the current one. Its
  children are always rendered, in a `<span>` that is `visibility: hidden` while
  the rate is not current, so the marker reserves its space in both states and
  the row does not reflow as it moves
- `<PlaybackRate.Change amount={0.1}>` — adjusts the rate by `amount`

Every rate write is clamped to 0.125–8: outside it Firefox keeps playing at
the requested speed with the sound cut, so that is the widest range audible in
both Chromium and Firefox. Safari is not yet measured. Stop playback with
pause; a rate of `0` is clamped like any other.

`<PlaybackRate.Set>` is **not** clamped to the slider's range: it names an
explicit rate, so `rate={8}` sets 8 where `<PlaybackRateSlider>` stops at 4.
`.Change` and the `<` `>` keys step through the same two actions, read the
rate off the element as they go, and stop at 0.125 and 8. A step never moves
the rate against its own direction.

### Playback rate slider

`<PlaybackRateSlider minValue={0.5} maxValue={4} step={0.1}>` is the root. Those
are the defaults; widen the range up to 0.125–8, and pass `step={0}` for a
continuous slider.

- `<PlaybackRateSlider.Control>` — the focusable slider
- `<PlaybackRateSlider.Progress>` — the filled part of the track
- `<PlaybackRateSlider.Background>` — the track behind the fill
- `<PlaybackRateSlider.Thumb>` — the draggable thumb

### Errors

- `<ErrorMessage>` — renders its children in a live region while the track has
  failed to load, and nothing otherwise

### `<MediaSession>`

Publishes the player to the operating system's media controls: the lock screen,
the notification shade, the desktop media overlay, headphone buttons and car
head units. It renders nothing. Leave it out for a sound effect, a preview clip
or a notification chime, which should not take over the lock screen.

```jsx
<AudioPlayer audioFile={{ src, title, artist, album, artwork }}>
  <MediaSession
    onPreviousTrack={() => setIndex((i) => i - 1)}
    onNextTrack={() => setIndex((i) => i + 1)}
  />
  {/* the rest of the UI */}
</AudioPlayer>
```

| Prop              | Type         | Description                                                                                                         |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `onPreviousTrack` | `() => void` | Shows a previous-track button and runs when it is pressed. Without it, there is no button.                          |
| `onNextTrack`     | `() => void` | Shows a next-track button and runs when it is pressed. Without it, there is no button.                              |
| `seekOffset`      | `number`     | Seconds the system's skip buttons move, in both directions, when the system does not name a distance. Default `10`. |

The card shows `title`, `artist`, `album` and `artwork` from `audioFile`. With
none of them set there is no card text at all, rather than "Untitled". An
artwork `src` the browser rejects as a URL drops the card and logs an error in
development; the player keeps working.

Play, pause, the skip buttons and the scrubber drive the player through the
same actions as the keyboard shortcuts, so a live stream ignores the skips as it
ignores `<SeekButton>`. The scrubber follows the position, duration and rate.

Previous and next are yours to handle, since the player holds one track (see
[Playlists](#playlists)). On iOS the lock screen shows either track or time
skips, not both, so passing `onNextTrack` replaces the skip-time buttons there;
Chrome on Android shows both. There is no stop action: the close button on
Chrome's desktop media controls pauses, as on other sites.

The browser has one media session per page. With several `<MediaSession>`
parts, the session belongs to the player that most recently started playing,
and stays with it while paused; before anything plays, the first one mounted
holds it. When the owner unmounts the session is cleared, and the others wait
until one of them plays — so if another player is still playing at that moment,
its card stays blank until it is paused and played again. The same goes for a
`<MediaSession>` rendered into a player that is already playing while another
player owns the session: it takes over on its next play, not on mount.

Where the browser has no Media Session API, it does nothing.

## Styling

Every part takes `className` and `style`. Every part also carries a `data-part`
attribute, so you can style from plain CSS without threading a class through
every element:

| Part                     | `data-part`    |
| ------------------------ | -------------- |
| `<PlayButton>`           | `play`         |
| `<MuteButton>`           | `mute`         |
| `<SeekButton>`           | `seek`         |
| `<Time.Toggle>`          | `time-toggle`  |
| `<Time.Elapsed>`         | `elapsed`      |
| `<Time.Remaining>`       | `remaining`    |
| `<Time.Duration>`        | `duration`     |
| `<PlaybackRate>`         | `root`         |
| `<PlaybackRate.Set>`     | `rate-set`     |
| `<PlaybackRate.Change>`  | `rate-change`  |
| `<PlaybackRate.Display>` | `rate-display` |
| `<ErrorMessage>`         | `error`        |
| a slider root            | `root`         |
| `.Control`               | `control`      |
| `.Progress`              | `progress`     |
| `.Background`            | `background`   |
| `.Thumb`                 | `thumb`        |

All three sliders share these part names, so each root also says which slider
it is: `data-slider="timeline"`, `"volume"` or `"rate"`.

```css
[data-slider="volume"] [data-part="progress"] {
  background: rebeccapurple;
}
```

`data-part` is what `aria-label` cannot be. The label is translatable — that is
what [`labels`](#localisation) is for — so `button[aria-label="Play audio"]` is a
selector that breaks the day you ship in German. A part name does not move.

### State attributes

**An attribute exists where the element does not already carry the
information.** That rule is why the list is this short, and why some states you
might look for are spelled in ARIA instead:

| State                         | Read it from                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| play/pause/loading/error      | `[data-part="play"][data-state="playing"]`                          |
| muted/low/high volume         | `[data-part="mute"][data-state="muted"]`                            |
| which time readout is showing | `[data-part="time-toggle"][data-state="elapsed"]`                   |
| a slider being dragged        | `[data-part="root"][data-state="dragging"]`                         |
| a slider's axis               | `[data-part="root"][data-orientation="vertical"]`                   |
| **unavailable**               | `[aria-disabled="true"]` — not `data-disabled`, and not `:disabled` |
| **the rate in effect**        | `[aria-pressed="true"]` on `.Set` — not `data-state`                |

There is deliberately no `data-disabled`: every button and `.Control` already
renders `aria-disabled`, and a second spelling of one state is one more thing to
keep in agreement. A slider root carries no disabled signal of its own, and
still does not need one — `[data-part="root"]:has([aria-disabled="true"])`
reaches it from the control inside.

Drag state lives on the slider **root**, not on the thumb: it is a property of
the slider, and every part is a descendant, so one attribute reaches all of
them.

```css
[data-part="root"][data-state="dragging"] [data-part="thumb"] {
  transform: scale(1.2);
}
```

`data-orientation` is on the root for the reason that makes it worth having at
all: `aria-orientation` sits on `.Control`, a child, where a root-level layout
rule cannot see it.

The state values are API — renaming `loading` would break your stylesheet — so
they are named in the props hooks' return types as well.

### The optional stylesheet

`.Control` is a `<button>`, so without a reset it renders with the browser's own
button chrome. The library ships those defaults as a stylesheet rather than
inline, because an inline style outranks every rule you could write:

```js
import "react-headless-audio-player/styles.css";
```

It sets three things: `width: 100%` on the root, the button reset on
`.Control`, and `cursor: grab` on `.Thumb`. Every rule is one selector deep, so
a single class of your own overrides it as long as your CSS loads afterwards.
Skip the import and you get no styling at all from the library beyond the
structural output below — which is the point of it being optional.

### What stays inline

The thumb's `transform`, grid placement, `position`, `touch-action` and
`z-index`. These are computed from the current value, so they are output
rather than opinion. Inline styles beat any stylesheet rule, so override these
through the `style` prop, which is merged last and wins.

The one exception is the progress fill's size and transform: `width: 100%`,
`height: 100%` and `scaleX(var(--progress))` — `scaleY()` from the bottom on a
vertical slider. They come from a rule the library renders itself, in a
`<style>` beside the fill, so they need no import. Its selectors are wrapped in
`:where()`, which has zero specificity, so any rule of yours on
`[data-part="progress"]` replaces them, wherever it loads. The fill repeats the
root's `data-orientation` for that rule to match.

Nothing animates. The position arrives in `timeupdate` steps, about four a
second, and the fill and the thumb both jump to each one — and straight to the
target of a seek. To smooth playback, add a transition and drop it for a drag,
knowing that a seek will glide too:

```css
.player [data-slider="timeline"] [data-part="progress"] {
  transition: transform 250ms linear;
}
.player [data-slider="timeline"][data-state="dragging"] [data-part="progress"] {
  transition: none;
}
```

A slider root is `display: grid` inline, because that is how its layers stack.
The `hidden` attribute still hides it. To hide one from CSS — in a media or
container query — use `display: none !important`, or hide an element wrapped
around it.

The three slider layers stack in one order: `.Background` at `z-index: 0`,
`.Progress` at `1`, `.Thumb` at `2`, whatever order you write them in. It is
declared rather than left to the fill's `transform`, so overriding that
transform does not put the background on top.

**A slider root needs a height.** It has none of its own, and a zero-height
track measures zero, which leaves the slider silently inert. Each slider's own
tooltip repeats this, since it is the mistake that produces no error at all.

### Custom properties

Every slider root also carries the two numbers behind the fill and the thumb,
as CSS custom properties that every part inherits:

| Property     | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| `--progress` | The filled fraction, unitless `0`–`1`                         |
| `--offset`   | The thumb's position along the track, in `px`, from the start |

The default fill reads `--progress`, and works with no stylesheet. Reach for
it yourself when a transform cannot draw what you want. `scaleX()` squashes a
`border-radius` along with the fill; a width does not:

```css
.player [data-part="progress"] {
  transform: none;
  width: calc(var(--progress) * 100%);
  border-radius: 999px;
}
```

A waveform is cut at the playhead rather than squashed:

```css
.waveform-played {
  transform: none;
  clip-path: inset(0 calc((1 - var(--progress)) * 100%) 0 0);
}
```

A gradient that stays put while the fill grows, or a conic dial, reads the
fraction the same way:

```css
.player [data-part="thumb"] {
  background: conic-gradient(
    rebeccapurple calc(var(--progress) * 360deg),
    transparent 0
  );
}
```

`--offset` runs the way the thumb's own transform does: from the left, or from
the top of a vertical slider, and reads `0px` until the track has been
measured. Both stay on the track when the value leaves the range — a rate set
past the slider's maximum reads `--progress: 1`.

## Props hooks

For when you already have a styled `<button>` of your own and want this
library's behaviour on it rather than its markup. Each of the six buttons is a
one-liner over its hook, so the hook gives you exactly what the component
renders:

```jsx
import { usePlayButtonProps } from "react-headless-audio-player";

function PlayPause() {
  return <MyButton {...usePlayButtonProps()}>▶</MyButton>;
}
```

| Hook                         | Component               | Extra argument |
| ---------------------------- | ----------------------- | -------------- |
| `usePlayButtonProps`         | `<PlayButton>`          | —              |
| `useMuteButtonProps`         | `<MuteButton>`          | —              |
| `useSeekButtonProps`         | `<SeekButton>`          | `amount`       |
| `useTimeToggleProps`         | `<Time.Toggle>`         | `defaultValue` |
| `usePlaybackRateSetProps`    | `<PlaybackRate.Set>`    | `rate`         |
| `usePlaybackRateChangeProps` | `<PlaybackRate.Change>` | `amount`       |

Each returns the accessible name, `type`, `data-part`, the click handler, the
media-key handler and the `aria-disabled` gate — plus `data-state` on the three
that have one, and `aria-pressed` on `.Set`.

**Pass your props in, don't add them after.** The bag composes them:

```jsx
<MyButton {...usePlayButtonProps({ onClick: track, className: "btn" })} />
```

Your handlers run first and the library's second, and `preventDefault()` in
yours opts out of ours. Adding `onClick` after the spread replaces the library's
instead, which silently breaks playback; passing it in is the only spelling that
composes. Where `amount`, `rate` or `defaultValue` is needed it is a leading argument rather than
a key of the bag, because React would pass an unrecognised lowercase attribute
through to the DOM — `<button rate="1.5">` in your page source.

**Spread the bag last.** The gate, the handlers and `type` are the library's and
cannot be overridden; the name, `data-part` and `data-state` sit in front of your
props, so you can replace those. Spread the bag first and your own props can
spread the gate away — which is the one way to defeat the accessibility
guarantees below.

There are no slider hooks, and there will not be. A design system has a button;
none has an audio scrubber, so there is no existing element to spread onto. The
bag would have to return a `ref` — spreading a `ref` onto a function component on
React 18 warns and drops it, leaving an unmeasured track that renders normally
and ignores every click. Use `<Timeline>` and `<Volume>`, whose `.Control` takes
`children`, `className` and `style` and composes handlers the same way.

## Hooks

For UI the components do not cover: a mini-player in a nav bar, a waveform,
analytics, resuming where the listener left off. All of these must be called
inside an `<AudioPlayer>`.

### `useAudioPlayer()`

Returns the player's state and its controls in one flat object.

```jsx
function TrackInfo() {
  const { paused, duration, volume, playerState, play, pause, seekBy } =
    useAudioPlayer();

  if (playerState === "loading") return <p>Loading…</p>;

  return (
    <button type="button" onClick={paused ? play : pause}>
      {paused ? "Play" : "Pause"} — {duration}s at {volume * 100}%
    </button>
  );
}
```

| Returns                                           |                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `duration`, `paused`, `volume`, `muted`, `rate`   | Read straight off the element.                                     |
| `playerState`                                     | `"loading" \| "error" \| "paused" \| "playing"`                    |
| `volumeState`                                     | `"muted" \| "low" \| "high"`                                       |
| `isDisabled`                                      | The track is errored. Loading does not disable — see below.        |
| `isSeekable`                                      | A position on the track can be named: the duration is known.       |
| `isLive`                                          | The track is a live stream. See `useIsLive()`.                     |
| `isBuffering`                                     | Playback wants to advance and cannot — the spinner condition.      |
| `error`                                           | The last failure, or `null`. See `useAudioError()`.                |
| `play`, `pause`, `toggle`                         |                                                                    |
| `seek(seconds)`, `seekBy(seconds)`                | Absolute and relative. `seekBy` takes negatives.                   |
| `setVolume(0–1)`, `toggleMute()`, `setRate(rate)` | `setVolume(0)` mutes, exactly as dragging the slider to zero does. |

The control methods keep the same identity for the lifetime of the player, so
they are safe to put in a dependency array.

### `useAudioError()`

Playback fails in two ways that need different handling, so they are reported
as a discriminated union rather than one flag:

```ts
type AudioError =
  | {
      kind: "media";
      reason: "aborted" | "network" | "decode" | "unsupported" | "unknown";
    }
  | { kind: "playback"; reason: string };
```

`kind: "media"` comes from the element's own `MediaError` — the resource is
unusable, and only a retry or a different `src` will help. `"network"` is worth
retrying; `"unsupported"` is not.

Reported only when the element also has no data to play, which is what a browser
reports for a source it cannot use. An `error` raised by an element that still
holds a buffer is ignored, because such an element can and does keep playing:
Firefox on a machine with no audio output device raises `MEDIA_ERR_DECODE`
milliseconds after `play()` and then plays the track to the end.

`kind: "playback"` means the resource is fine and the browser refused the
command. `reason` is the `DOMException` name, almost always
`"NotAllowedError"` — autoplay policy, which any user gesture lifts:

```jsx
function PlayPrompt() {
  const { error, play } = useAudioPlayer();

  if (error?.kind === "playback") {
    return <button onClick={play}>Tap to play</button>;
  }
  return null;
}
```

`AbortError` is never reported. It fires whenever a `pause()` or a `src` change
overtakes a pending `play()` — a double-click, or a held key — and the user's
intent was honoured, so there is nothing to tell them.

A media error wins when both are set. A playback error clears when a `play()`
finally succeeds, and deliberately survives a `src` change: an autoplay block
outlives the track that revealed it.

### `useIsSeekable()`

Whether a position on the track can be named — the duration is known and
non-zero. It is what disables the timeline and the seek buttons, and **loading is
not.**

```jsx
function SkipButton() {
  const { seekBy } = useAudioPlayer();
  const seekable = useIsSeekable();

  return (
    <button type="button" aria-disabled={!seekable} onClick={() => seekBy(30)}>
      +30s
    </button>
  );
}
```

Two things this catches that a load-state check does not:

- **A live stream.** `duration` is `Infinity` while `readyState` is perfectly
  healthy, so there is no end to seek towards. `playerState` says `"playing"`.
- **Nothing else.** Volume, mute, playback rate and `play()` all work before
  metadata arrives, so they are not gated. `play()` in particular: the browser
  queues it at `readyState: 0`, and because changing `audioFile.src` re-enters
  loading, a gate there would suppress the first press on every playlist advance.

The loading state is still announced — on the accessible name, which reads
"Loading audio" — rather than by making the button unavailable.

### `useIsLive()`

Whether the track is a live stream: the element reports an unbounded duration,
or [`audioFile.live`](#live-streams-in-firefox) says so.
For a "LIVE" badge, hiding the clock, or swapping the timeline for a "listen
live" control:

```jsx
function Scrubber() {
  const live = useIsLive();

  if (live) return <span data-live>LIVE</span>;

  return (
    <Timeline>
      <Timeline.Control />
    </Timeline>
  );
}
```

It is not the inverse of `useIsSeekable()`. Both are false before metadata
arrives: that one says a position cannot be named _yet_, this one says it never
will be. Gate the timeline on the first and the badge on the second.

`duration` still reads `0` for a live stream, as it does before metadata — so
this hook is the only place the two are told apart. A stream that later reports
a finite length, such as a recording that finished, stops being live on
`durationchange`, unless `audioFile.live` says otherwise.

### Live streams in Firefox

Firefox reports some live streams as a finite track: for MP3 and Opus, the
duration is how far it has buffered, and grows about once a second. Chromium,
and Firefox's AAC, report `Infinity`. Measured in Chromium 151 and Firefox 153;
Safari is not yet measured.

The player cannot tell such a stream from a file, so say it is live:

```jsx
<AudioPlayer audioFile={{ src: stationUrl, live: true }}>
```

Nothing overrides it, and in a playlist it follows the current `audioFile`.

### `useIsVolumeAvailable()`

Whether this browser lets a page set the volume. `false` on iOS, where Apple
keeps the level under the hardware buttons: `HTMLMediaElement.volume` accepts a
write and ignores it, and always reads `1`. `muted` is unaffected.

`<Volume.Control>` is already `aria-disabled` there, so nothing breaks if you
ignore this. Use it to leave the slider out altogether and keep `<MuteButton>`:

```jsx
function VolumeControls() {
  const available = useIsVolumeAvailable();

  return (
    <>
      <MuteButton>🔇</MuteButton>
      {available && <VolumeSlider />}
    </>
  );
}
```

Probed once per page on a detached element, so the player's own element is
never written to. It is the one hook that works outside `<AudioPlayer>`: it
asks the browser, not the player. On the server it reads `true`, and a hydrating
client renders that first and then corrects itself, so rendering on it does not
mismatch.

### `useIsBuffering()`

`isBuffering` on its own, for a spinner that has no reason to subscribe to the
rest of the player.

```jsx
function Spinner() {
  return useIsBuffering() ? <div className="spinner" /> : null;
}
```

It is independent of `playerState`, which stays `"playing"` through a stall: the
player is still in play mode, so your button keeps offering Pause and pressing it
still works. `playerState === "loading"` means the track has not loaded yet;
`isBuffering` means it loaded and then ran out of data.

Seeking into unbuffered audio while paused does not report as buffering.

### `useIsAtEnd()`

Whether the position is the end of the track — for an end-of-track card, a
Replay button, or greying out "next".

```jsx
function Replay() {
  const { seek, play } = useAudioPlayer();

  if (!useIsAtEnd()) return null;

  return (
    <button
      onClick={() => {
        seek(0);
        play();
      }}
    >
      Replay
    </button>
  );
}
```

**A statement about position, not about history.** Dragging to the end reports
`true` with nothing having played, and it clears as soon as the position moves.
Use `onEnded` for the edge — "the track just finished, advance now" — and this
for the level.

Derived from the position rather than tracked, like `useIsBuffering()`: there is
no flag to get stuck on, and nothing to go stale across a `src` change. The test
is `currentTime >= duration` rather than an approximate match, because a browser
parks slightly _past_ the duration when playback ends — Chrome reports about
0.5 s beyond it — so a tolerance-based comparison reads false at exactly the
moment the track finishes.

It stays `false` under `audioProps={{ loop: true }}`. A looping element wraps to
0 rather than resting at the end, and does so without a `timeupdate` ever
reporting the end.

### `useCurrentSecond()` and `useCurrentTime()`

The playback position is not part of `useAudioPlayer()`. It changes about four
times a second, and folding it in would re-render every caller at that rate for a
value most of them are not watching.

```jsx
const second = useCurrentSecond(); // whole seconds — re-renders 1x/sec
const time = useCurrentTime(); // raw position — re-renders ~4x/sec
```

Use `useCurrentSecond` for anything a human reads. Reach for `useCurrentTime`
only for something drawn continuously, such as a waveform or a custom progress
bar.

## Keyboard shortcuts

Available on every focusable control. A slider's own keys take precedence over
the shortcuts below.

Inside [`<PlayerRoot>`](#accessibility) they reach every control, your own
included — a playlist's previous and next buttons — and work after a click
anywhere on the player. A key a library control already handled stops there,
so nothing runs twice, and keys typed into a text field, `<select>` or
`contenteditable` are left alone. They work only while focus is inside the
player: the shortcuts are never page-wide.

On a focused slider the arrow keys adjust its value, and `Home` and `End` jump to
the ends of its range. Those two are slider-only: everywhere else they stay the
browser's.

| Keys             | Action                     |
| ---------------- | -------------------------- |
| `p`, `k`         | Play/pause                 |
| `s`              | Stop and return to start   |
| `m`              | Mute/unmute                |
| `←` / `→`        | Seek 5 seconds             |
| `j` / `l`        | Seek 10 seconds            |
| `↑` / `↓`        | Volume by 0.025            |
| `<` `>`, `[` `]` | Playback rate by 0.05      |
| `Backspace`      | Reset the rate to 1x       |
| `0`–`9`          | Jump to 0–90% of the track |

Media keys (`MediaPlayPause`, `MediaStop`, `MediaMute`, `MediaVolumeUp`,
`MediaVolumeDown`) map to the same actions. Combinations with Ctrl, Cmd or Alt
are left to the browser and to assistive technology.

`Space` keeps activating the focused button. On `<PlayerRoot>` it plays and
pauses while the root itself has focus, say after a click on the cover, where it would otherwise scroll the
page. Bind `" "` in `customKeyboardShortcuts` to change that everywhere, or
set it to `null` to leave Space alone on the container too.

A binding is a `KeyboardAction`, or `null` to unbind — `KeyToActionMap` is
`Record<string, KeyboardAction | null>`. `customKeyboardShortcuts={{ p: null }}`
drops the default play/pause binding and lets `p` reach the browser. It is
player-wide rather than per-control: a key that works on one button and not its
neighbour is a bug report, not a feature.

One of the player's internal actions is deliberately not bindable: the slider
commit, which carries a value in one component's units and means nothing without
the gesture that produced it.

## Roadmap

Additive, in the order they are likely to land. None changes what ships today.

- `<source>` fallback, with the `AudioFile` shape shown under
  [`<AudioPlayer>`](#audioplayer)
- A `ref` on every part, for focus management and measurement; `audioRef`
  reaches the `<audio>` element today
- Playlist components, skip and loop (`onEnded` already supports a userland
  playlist)
- Caption and subtitle support

## Testing

```bash
# Unit tests (jsdom)
pnpm test

# End-to-end tests (Playwright)
pnpm testE2E
```

## Requirements

- React 18 or later, for `useSyncExternalStore` — CI runs the whole suite
  against React 18 and React 19
- Chrome, Firefox, Safari, Edge
- **ESM only.** There is no CommonJS build, so `require("react-headless-audio-player")`
  fails with `ERR_REQUIRE_ESM` — a message that names Node rather than this
  package. Use `import`, or `await import()` from CommonJS. Node 18 or later.

Times are formatted as `M:SS`, or `H:MM:SS` for content an hour or longer, unless
you supply a [`labels.time`](#localisation) entry.

Live streams play. Play, pause, volume, mute and rate all work on an unbounded
duration; only the timeline and the seek buttons are disabled, through
[`useIsSeekable()`](#useisseekable), and [`useIsLive()`](#useislive) names the
state so you can show a badge or swap the scrubber out. `duration` reads `0`
for a live stream, as it does before metadata. Firefox reports MP3 and Opus
streams as finite, so pass
[`audioFile.live`](#live-streams-in-firefox) for those.

## License

MIT
