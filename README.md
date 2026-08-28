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

| Prop                      | Type                               | Description                                                                            |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `audioFile`               | `{ src: string }`                  | The track to play. Required.                                                           |
| `onEnded`                 | `() => void`                       | Called once when the track finishes, after the element has been returned to the start. |
| `customKeyboardShortcuts` | `Record<string, SideEffectAction>` | Merged over the defaults, so a key you do not name keeps its default binding.          |

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
needs a length on a duration greater than zero.

## License

MIT
