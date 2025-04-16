# React Audio Player (in development)

An accessible headless audio player component for React applications.

## Features

- 🎛️ Comprehensive playback controls (play/pause, mute, seek, volume)
- ⏱️ Playback rate adjustment
- 📝 Caption/subtitle support
- ⌨️ Complete keyboard navigation and screen reader support
- 🧩 Composable component architecture
- 📱 Responsive design with support for horizontal and vertical layouts

## Basic Usage

```jsx
import { AudioPlayer, PlayButton, Timeline, Volume } from "react-audio-player";

function App() {
  return (
    <AudioPlayer
      audioFiles={[{ src: "audio-file.mp3" }]}
    >
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

## Components

### `<AudioPlayer>`

The root component that provides context to all child components.

```jsx
<AudioPlayer
  audioFiles={[
    { src: "audio.mp3", type: "audio/mpeg", captionSrc: "captions.vtt" },
  ]}
>
  {/* Player UI components */}
</AudioPlayer>
```

### Timeline Components

- `<Timeline>` - Container for timeline components
- `<Timeline.Seek>` - Clickable area for seeking
- `<Timeline.Progress>` - Visual progress indicator
- `<Timeline.Drag>` - Draggable control for seeking

### Playback Control Components

- `<PlayButton>` - Toggle play/pause
- `<MuteButton>` - Toggle mute
- `<Seek amount={10}>` - Skip forward/backward by amount in seconds

### Volume Components

- `<Volume orientation="horizontal|vertical">` - Volume control container
- `<Volume.Set>` - Clickable area for volume adjustment
- `<Volume.Progress>` - Visual volume level indicator
- `<Volume.Drag>` - Draggable control for volume

### Time Display Components

- `<Time.Elapsed>` - Display current playback time
- `<Time.Remaining>` - Display remaining time
- `<Time.Duration>` - Display total duration

### Playback Rate Components

- `<PlaybackRate.Display>` - Shows current playback rate
- `<PlaybackRate.Set rate={1.5}>` - Set specific playback rate
- `<PlaybackRate.Change amount={0.1}>` - Adjust playback rate

### Caption Components

- `<Captions>` - Display synchronized captions/subtitles

## Accessibility

This player fully supports:

- Keyboard navigation
- ARIA attributes
- Screen reader announcements
- Focus management

## Testing

```bash
# Run unit tests (JSDOM)
npm test
# or
npm run test:unit

# Run end-to-end tests (Playwright)
npm run test:e2e
```

## Browser Support

- Chrome, Firefox, Safari, Edge
- React 16.8+ (requires Hooks)

## License

MIT
