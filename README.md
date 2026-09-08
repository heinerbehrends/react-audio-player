# React Audio Player (in development)

A headless, accessible audio player for React, composed the way Radix UI
components are: you get behaviour, semantics and state, and you supply all of
the markup and styling.

## Features

- 🎨 Unstyled — every part takes your own `className` and `style`
- 🧩 Compound components, placed anywhere in your own layout
- 🎛️ Play/pause, mute, seek, volume and playback rate
- ⌨️ Keyboard shortcuts, ARIA slider semantics and screen reader announcements
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

The volume slider announces the mute as well as the volume — "Muted, 80%" — since
the two are separate on the element and the arrow keys change the volume without
unmuting.

Each control says its state in exactly one place.

For the three toggles that is the **name**, which changes with the state:
`<MuteButton>` is "Mute" or "Unmute", `<PlayButton>` is "Play audio", "Pause
audio", "Loading audio" or "Error loading audio", and `<Time.Toggle>` is "Show
time elapsed" or "Show time remaining". None of them sets `aria-pressed` — a
name that already says which way the toggle will go, plus a pressed state saying
it has already gone, announces as a contradiction ("Unmute, toggle button,
pressed").

For `<PlaybackRate.Set>` it is **`aria-pressed`**, because its name does not
move: "Set playback rate to 1.5x" reads the same whether or not that rate is in
effect, so the name has no state to carry. The rate in effect is
`aria-pressed="true"` and the others are `"false"` rather than absent, so the
row announces as a set of choices rather than as unrelated buttons.

Pass your own `aria-label` to override any of them.

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
position on the track.

Errors render into a live region. Every control also accepts the global media
shortcuts while focused, whether or not it is disabled: the shortcuts belong to
the player, not to the control. A slider's own arrow keys are the exception —
those stop while it is disabled.

## Components

### `<AudioPlayer>`

The root. Creates the store, renders the `<audio>` element, and provides both to
everything below it.

```jsx
<AudioPlayer audioFile={{ src: "audio.mp3" }}>
  {/* Player UI components */}
</AudioPlayer>
```

| Prop                      | Type                    | Description                                                                                      |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `audioFile`               | `AudioFile`             | The track to play. Required.                                                                     |
| `onEnded`                 | `() => void`            | Called once when the track finishes, after the element has been returned to the start.           |
| `customKeyboardShortcuts` | `KeyToActionMap`        | Merged over the defaults, so a key you do not name keeps its default binding.                    |
| `audioProps`              | `AudioHTMLAttributes`   | Forwarded to the underlying `<audio>`. Excludes `src` and `onEnded`, which have dedicated props. |
| `audioRef`                | `Ref<HTMLAudioElement>` | A ref to the `<audio>` element itself.                                                           |

```ts
type AudioFile = {
  src: string;
  // Metadata is accepted but not read yet. It is declared now so that adding
  // Media Session support later is not a breaking change.
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

Use `audioRef` for anything that needs the element itself: Web Audio,
HLS.js/dash.js, or the Media Session API. Prefer a stable ref — an inline
callback re-runs the forwarding effect on every render.

One format is loaded per track; `<source>` fallback is not supported yet (see
`BACKLOG.md`).

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

### Timeline

`<Timeline step={5}>` is the root and takes an optional arrow-key step in
seconds; its maximum is the track duration, so it takes no `maxValue`.

- `<Timeline.Control>` — the focusable slider: click to seek, arrow keys to step
- `<Timeline.Progress>` — the filled part of the track
- `<Timeline.Background>` — the track behind the fill
- `<Timeline.Thumb>` — the draggable thumb

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

### Time display

- `<Time.Elapsed>` — position, while the display is showing elapsed time
- `<Time.Remaining>` — time left, while the display is showing remaining time
- `<Time.Duration>` — track length
- `<Time.Toggle>` — switches between elapsed and remaining

### Playback rate

- `<PlaybackRate>` — groups the rate controls
- `<PlaybackRate.Display>` — the current rate
- `<PlaybackRate.Set rate={1.5}>` — sets that rate
- `<PlaybackRate.Current rate={1.5}>` — marks that rate as the current one. Its
  children are always rendered, in a `<span>` that is `visibility: hidden` while
  the rate is not current, so the marker reserves its space in both states and
  the row does not reflow as it moves
- `<PlaybackRate.Change amount={0.1}>` — adjusts the rate by `amount`

### Playback rate slider

`<PlaybackRateSlider minValue={0.5} maxValue={4} step={0.1}>` is the root. Those
are the defaults; pass `step={0}` for a continuous slider.

- `<PlaybackRateSlider.Control>` — the focusable slider
- `<PlaybackRateSlider.Progress>` — the filled part of the track
- `<PlaybackRateSlider.Background>` — the track behind the fill
- `<PlaybackRateSlider.Thumb>` — the draggable thumb

### Errors

- `<ErrorMessage>` — renders its children in a live region while the track has
  failed to load, and nothing otherwise

## Styling

Every part takes `className` and `style`. Each slider part also carries a
`data-part` attribute, so you can style them from plain CSS without threading a
class through every element:

| Part          | `data-part`  |
| ------------- | ------------ |
| the root      | `root`       |
| `.Control`    | `control`    |
| `.Progress`   | `progress`   |
| `.Background` | `background` |
| `.Thumb`      | `thumb`      |

```css
/* Scope to your own container: all three sliders share these part names. */
.player [data-part="progress"] {
  background: rebeccapurple;
}
```

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

`transform`, `transform-origin`, grid placement, `position` and
`touch-action` — plus the width and height that make the progress fill's
`scaleX()` mean anything. These are computed from the current value, so they are
output rather than opinion. Inline styles beat any stylesheet rule, so override
these through the `style` prop, which is merged last and wins.

**A slider root needs a height.** It has none of its own, and a zero-height
track measures zero, which leaves the slider silently inert. Each slider's own
tooltip repeats this, since it is the mistake that produces no error at all.

## Hooks

For UI the components do not cover: a mini-player in a nav bar, a waveform,
analytics, resuming where the listener left off. All three must be called inside
an `<AudioPlayer>`.

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

`Space` is not bound, so it keeps activating the focused button. Pass
`customKeyboardShortcuts={{ " ": { type: "TOGGLE_PLAY" } }}` if you want it.

A binding is a `KeyboardAction` — `KeyToActionMap` is `Record<string, KeyboardAction>`.
Two of the player's internal actions are deliberately not bindable: the slider
commit, which carries a value in one component's units and means nothing without
the gesture that produced it, and the end-of-track signal, which would fake a
track ending and advance your playlist.

## Roadmap

- Improve testing
- Initial beta release
- Playlist components, skip and loop (`onEnded` already supports a userland
  playlist)
- Caption and subtitle support
- Multi-language support

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

Times are formatted as `M:SS`, or `H:MM:SS` for content an hour or longer. Live
streams are not supported: an unbounded duration reads as `0`, so gate any UI
that needs a length on `useAudioPlayer().duration > 0`.

## License

MIT
