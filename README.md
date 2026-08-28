# React Audio Player (in development)

An accessible headless audio player component for React applications inspired by the Radix UI library.

## Features

- 🎨 Style the components any way you want
- 🧩 Composable component architecture
- 🎛️ Comprehensive playback controls (play/pause, mute, seek, volume, playbackRate)
- ⌨️ Keyboard navigation and screen reader support
- ✔️ No dependencies except React 18+

## Basic Usage

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
        <Timeline.Seek>
          <Timeline.Progress />
        </Timeline.Seek>
        <Timeline.Drag />
      </Timeline>

      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>

      <Volume>
        <Volume.Set>
          <Volume.Progress />
        </Volume.Set>
        <Volume.Drag />
      </Volume>
    </AudioPlayer>
  );
}
```

## Accessibility

This player fully supports:

- Keyboard navigation
- ARIA attributes
- Screen reader announcements
- Focus management

## Components

### `<AudioPlayer>`

The root component that provides context to all child components.

```jsx
<AudioPlayer audioFile={{ src: "audio.mp3" }}>
  {/* Player UI components */}
</AudioPlayer>
```

| Prop                      | Type                               | Description                                                                                      |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `audioFile`               | `AudioFile`                        | The track to play. Required.                                                                     |
| `onEnded`                 | `() => void`                       | Called once when the track finishes, after the element has been returned to the start.           |
| `customKeyboardShortcuts` | `Record<string, SideEffectAction>` | Merged over the defaults, so a key you do not name keeps its default binding.                    |
| `audioProps`              | `AudioHTMLAttributes`              | Forwarded to the underlying `<audio>`. Excludes `src` and `onEnded`, which have dedicated props. |
| `audioRef`                | `Ref<HTMLAudioElement>`            | A ref to the `<audio>` element itself.                                                           |

```ts
type AudioFile = {
  src: string;
  // Metadata is accepted but not yet read by the library. It is here so that
  // adding Media Session support later is not a breaking change.
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

Only one format is loaded per track — `<source>` fallback is not supported yet
(see `BACKLOG.md`).

#### Playlists

The player holds one track. Keep the list and the index in your own state and
advance it from `onEnded` — swapping `audioFile` reloads the element and
re-primes every value the player exposes:

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

### Timeline Components

- `<Timeline>` - Container for timeline components
- `<Timeline.Seek>` - Clickable area for seeking, and the element that carries the
  slider semantics
- `<Timeline.Progress>` - Visual progress indicator
- `<Timeline.Background>` - Track behind the indicator
- `<Timeline.Drag>` - Draggable control for seeking

### Playback Control Components

- `<PlayButton>` - Toggle play/pause
- `<PlayButton.Playing>` - Renders its children while playing
- `<PlayButton.Paused>` - Renders its children while not playing
- `<MuteButton>` - Toggle mute
- `<MuteButton.Muted>` - Renders its children while muted
- `<MuteButton.LowVolume>` - Renders its children below half volume
- `<MuteButton.HighVolume>` - Renders its children at or above half volume
- `<Seek amount={10}>` - Skip forward/backward by amount in seconds

### Volume Components

- `<Volume orientation="horizontal|vertical">` - Volume control container
- `<Volume.Set>` - Clickable area for volume adjustment, and the element that
  carries the slider semantics
- `<Volume.Progress>` - Visual volume level indicator
- `<Volume.Background>` - Track behind the indicator
- `<Volume.Drag>` - Draggable control for volume

### Time Display Components

- `<Time.Elapsed>` - Display current playback time
- `<Time.Remaining>` - Display remaining time
- `<Time.Duration>` - Display total duration
- `<Time.Toggle>` - Toggle between elapsed and remaining

### Playback Rate Components

- `<PlaybackRate>` - Container for the rate buttons
- `<PlaybackRate.Display>` - Shows current playback rate
- `<PlaybackRate.Set rate={1.5}>` - Set specific playback rate
- `<PlaybackRate.Current rate={1.5}>` - Renders its children when that rate is
  current
- `<PlaybackRate.Change amount={0.1}>` - Adjust playback rate

### Playback Rate Slider

- `<PlaybackRateSlider minValue={0.5} maxValue={4} step={0.1}>` - Container for a
  continuous or stepped playback rate slider
- `<PlaybackRateSlider.Set>` - Clickable area for setting the rate, and the element
  that carries the slider semantics
- `<PlaybackRateSlider.Progress>` - Visual rate indicator
- `<PlaybackRateSlider.Background>` - Track behind the indicator
- `<PlaybackRateSlider.Drag>` - Draggable control for the rate

### Error Component

- `<ErrorMessage>` - Displays a customizable message on error

## Hooks

For UI the components do not cover — a mini-player in a nav bar, a waveform,
analytics, resuming where the listener left off. All three must be called inside
an `<AudioPlayer>`.

### `useAudioPlayer()`

Returns the player's state and its controls, flat:

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
| `isDisabled`                                      | True until the track is ready, and while it is errored.            |
| `play`, `pause`, `toggle`                         |                                                                    |
| `seek(seconds)`, `seekBy(seconds)`                | Absolute and relative. `seekBy` takes negatives.                   |
| `setVolume(0–1)`, `toggleMute()`, `setRate(rate)` | `setVolume(0)` mutes, exactly as dragging the slider to zero does. |

The control methods are stable for the lifetime of the player, so they are safe
to put in a dependency array.

### `useCurrentSecond()` and `useCurrentTime()`

The playback position is **not** part of `useAudioPlayer()`, on purpose. It
changes about four times a second, and folding it in would re-render every
caller at that rate for values they are not watching.

```jsx
const second = useCurrentSecond(); // whole seconds — re-renders 1x/sec
const time = useCurrentTime(); // raw position — re-renders ~4x/sec
```

Use `useCurrentSecond` for anything a human reads. Reach for `useCurrentTime`
only for something drawn continuously, such as a waveform or a custom progress
bar.

## Roadmap

- Improve testing
- Initial beta release
- Add playlist components and skip and loop (`onEnded` already supports a userland playlist)
- Add caption/subtitle support
- Add multi-language support

## Testing

```bash
# Run unit tests (JSDOM)
pnpm test

# Run end-to-end tests (Playwright)
pnpm testE2E
```

## Requirements

- Chrome, Firefox, Safari, Edge
- React 18+ (requires `useSyncExternalStore`)

Times are formatted as `M:SS`, or `H:MM:SS` for content an hour or longer. Live
streams are not supported: an unbounded duration reads as `0`, so gate any UI that
needs a length on `useAudioPlayer().duration > 0`.

## License

MIT
