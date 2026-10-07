# React Headless Audio Player

A headless, accessible audio player for React. Compound components give you
the behaviour, the semantics and the state; you supply all of the markup and
styling. Where you would rather use a button of your own, each button also
ships as a props hook.

**Beta.** Published under the `beta` dist-tag until 1.0, and the API can change
between betas. Every change is listed in the
[changelog](https://github.com/heinerbehrends/react-audio-player/blob/main/CHANGELOG.md).

[Demo](https://heinerbehrends.github.io/react-audio-player/) ·
[Examples](https://github.com/heinerbehrends/react-audio-player/tree/main/examples) ·
[Guides](#guides)

- 🎨 Unstyled: every part takes your own `className` and `style`
- 🧩 Compound components, placed anywhere in your own layout
- 🪝 A props hook for every button, to spread onto your design system's `Button`
- 🎯 `data-part` and `data-state` attributes to style every part and state
- 🎛️ Play and pause, mute, seek, volume and playback rate
- ⌨️ Keyboard shortcuts, slider semantics and screen reader names
- 🔒 Lock screen, media keys and notification controls through `<MediaSession>`
- 📻 Playlists and live streams: you keep the list, the player plays the track
- 🟦 TypeScript, with a doc comment on every part and prop
- ✔️ No dependencies beyond React

## Contents

- [Install](#install)
- [Getting started](#getting-started)
- [Guides](#guides)
- [Components](#components)
- [Hooks](#hooks)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Roadmap](#roadmap)
- [Development](#development)
- [License](#license)

## Install

```bash
npm install react-headless-audio-player@beta
```

- React 18 or later. CI runs against React 18 and 19.
- **ESM only.** There is no CommonJS build, so
  `require("react-headless-audio-player")` fails with `ERR_REQUIRE_ESM`. Use
  `import`, or `await import()` from CommonJS. Node 18 or later.
- Chrome, Firefox, Safari and Edge.

## Getting started

### A first player

```jsx
import {
  AudioPlayer,
  MuteButton,
  PlayButton,
  PlayerRoot,
  Time,
  Timeline,
  Volume,
} from "react-headless-audio-player";
import "react-headless-audio-player/styles.css";
import "./player.css";

export function Player() {
  return (
    <AudioPlayer audioFile={{ src: "/episode.mp3", title: "Episode 1" }}>
      <PlayerRoot className="player">
        <PlayButton>
          <PlayButton.Playing>Pause</PlayButton.Playing>
          <PlayButton.Paused>Play</PlayButton.Paused>
        </PlayButton>

        <Timeline>
          <Timeline.Control>
            <Timeline.Background />
            <Timeline.Progress />
          </Timeline.Control>
          <Timeline.Thumb />
        </Timeline>

        <Time.Toggle />

        <MuteButton>
          <MuteButton.Muted>Unmute</MuteButton.Muted>
          <MuteButton.LowVolume>Mute</MuteButton.LowVolume>
          <MuteButton.HighVolume>Mute</MuteButton.HighVolume>
        </MuteButton>

        <Volume>
          <Volume.Control>
            <Volume.Background />
            <Volume.Progress />
          </Volume.Control>
          <Volume.Thumb />
        </Volume>
      </PlayerRoot>
    </AudioPlayer>
  );
}
```

`<AudioPlayer>` holds the state and renders the `<audio>` element. Every other
part and hook must be rendered inside it.

`<PlayerRoot>` is optional, and worth having: it renders a `<div>` named by
`audioFile.title`, so screen reader users can tell two players apart, and the
keyboard shortcuts work anywhere inside it.

Each slider has one required part, `.Control`, the element that carries the
slider role, takes the arrow keys and measures the track. `.Background`,
`.Progress` and `.Thumb` are optional layers.

### Styling it

`styles.css` is optional. It resets `.Control`'s button chrome and gives each
slider root its full width, and nothing more; the rest is yours. Every part
carries a `data-part` attribute to select on:

```css
/* player.css */
.player {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* A slider root has no height of its own. Without one, the track measures
   zero and ignores every click. */
.player [data-part="root"] {
  height: 20px;
}
.player [data-slider="timeline"] {
  flex: 1;
}
.player [data-slider="volume"] {
  flex: none;
  width: 80px;
}

/* Padding makes the track thin and keeps all 20px clickable. */
.player [data-part="control"] {
  box-sizing: border-box;
  padding: 9px 0;
  cursor: pointer;
}
.player [data-part="background"] {
  background: #ddd;
}
.player [data-part="progress"] {
  background: rebeccapurple;
}

/* The thumb's position along the track is inline; across it is yours. */
.player [data-part="thumb"] {
  top: calc(50% - 6px);
  width: 12px;
  height: 12px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rebeccapurple;
}

/* Unavailable controls are aria-disabled, never :disabled. */
.player [aria-disabled="true"] {
  opacity: 0.4;
}
```

That is a working, styled player. The
[basic example](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/basic)
is the same player with icons and a volume slider that opens on hover; the
[styling guide](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/styling.md)
lists every selector, state attribute and custom property.

## Guides

Each guide covers one task. The examples are runnable projects, and all of them
run on the [demo page](https://heinerbehrends.github.io/react-audio-player/).

| Task                                      | Guide                                                                                                                 | Example                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Style the parts                           | [Styling](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/styling.md)                             | [basic](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/basic)       |
| Play a list of tracks                     | [A playlist](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/playlist.md)                 | [playlist](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/playlist) |
| Play a radio station                      | [A live stream](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/live-stream.md)           | [live](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/live)         |
| Show chapters, the buffer and an end card | [Chapters and the playhead](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/chapters.md)  | [podcast](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/podcast)   |
| Handle load errors and autoplay           | [Errors and autoplay](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/errors.md)          | [live](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/live)         |
| Show the track on the lock screen         | [The lock screen](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/lock-screen.md)         | [playlist](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/playlist) |
| Translate the names and readouts          | [Labels and localisation](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/localisation.md)        |                                                                                              |
| Change the keyboard shortcuts             | [Keyboard](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/keyboard.md)                           |                                                                                              |
| Use a design system's buttons             | [Your own buttons](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/your-own-buttons.md)           |                                                                                              |
| Build UI the parts do not cover           | [Custom UI with hooks](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/custom-ui.md)              | [waveform](https://github.com/heinerbehrends/react-audio-player/tree/main/examples/waveform) |
| Add captions, Web Audio or HLS            | [The `<audio>` element](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/audio-element.md) |                                                                                              |
| Know what is announced, and what is yours | [Accessibility](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/accessibility.md)                 |                                                                                              |

Where the example cell is empty, the guide carries its own code; an example for
each of those is planned.

## Components

Every part takes `className`, `style` and a `ref` to its own element, and
carries a `data-part`. Each one's tooltip in your editor gives its element,
attributes, units and defaults.

### `<AudioPlayer>`

The root. Creates the store and renders the `<audio>` element.

| Prop                      | Type                    | Description                                                                                                                                                      |
| ------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioFile`               | `AudioFile`             | The track: `src`, plus `live`, `title`, `artist`, `album` and `artwork`. A new `src` swaps the track. Required.                                                  |
| `onEnded`                 | `() => void`            | Called once when the track plays to its end. Change `audioFile` here to advance a playlist.                                                                      |
| `labels`                  | `PlayerLabels`          | Your own strings for every name and readout. See [Labels and localisation](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/localisation.md). |
| `customKeyboardShortcuts` | `KeyToActionMap`        | Merged over the default [shortcuts](#keyboard-shortcuts); `null` unbinds a key.                                                                                  |
| `audioProps`              | `AudioHTMLAttributes`   | Forwarded to the `<audio>` element. Excludes `src` and `onEnded`.                                                                                                |
| `audioRef`                | `Ref<HTMLAudioElement>` | A ref to the `<audio>` element.                                                                                                                                  |

### Parts

| Part                                                          | What it is                                                                                                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<PlayerRoot>`                                                | An optional named container that a click focuses, with the shortcuts on everything inside it.                                                                                                       |
| `<PlayButton>`                                                | Plays and pauses.                                                                                                                                                                                   |
| `.Playing`, `.Paused`                                         | Render their children while playing, and while not.                                                                                                                                                 |
| `<MuteButton>`                                                | Mutes, and unmutes to the last audible volume.                                                                                                                                                      |
| `.Muted`, `.LowVolume`, `.HighVolume`                         | Render their children while muted, below half volume, and at half volume or above.                                                                                                                  |
| `<SeekButton amount={10}>`                                    | Jumps by `amount` seconds; negative rewinds.                                                                                                                                                        |
| `<Timeline step={5}>`                                         | The scrub bar. `step` is in seconds.                                                                                                                                                                |
| `.Control`                                                    | The slider itself: the tab stop, the arrow keys, `Home` and `End`. Required on every slider.                                                                                                        |
| `.Background`, `.Progress`, `.Thumb`                          | The track, the fill and the drag handle. Optional, and the same on every slider.                                                                                                                    |
| `<TimelineBuffered>`                                          | How much has downloaded, behind the fill. A separate import; render it inside `<Timeline.Control>`.                                                                                                 |
| `<Volume orientation="vertical">`                             | The volume slider, `0`–`1`, with the same parts as `<Timeline>`. Reaching zero mutes. Disabled on iOS.                                                                                              |
| `<PlaybackRateSlider minValue={0.5} maxValue={4} step={0.1}>` | A rate slider with the same parts; those are the defaults. Widen up to `0.125`–`8`, or `step={0}` for a continuous slider.                                                                          |
| `<Time.Elapsed>`, `<Time.Remaining>`, `<Time.Duration>`       | The position, the time left as `-1:30`, and the length. Each always shows its own number.                                                                                                           |
| `<Time.Toggle defaultValue="remaining">`                      | A button showing elapsed or remaining time, switching on press. Each toggle keeps its own choice.                                                                                                   |
| `<PlaybackRate>`                                              | Groups the rate controls for assistive technology.                                                                                                                                                  |
| `<PlaybackRate.Set rate={1.5}>`                               | Sets that rate, clamped to `0.125`–`8` but not to the slider's range.                                                                                                                               |
| `<PlaybackRate.Change amount={0.25}>`                         | Steps the rate by `amount`, stopping at `0.125` and `8`.                                                                                                                                            |
| `<PlaybackRate.Current rate={1.5}>`                           | Marks that rate while it is in effect, keeping its space while it is not.                                                                                                                           |
| `<PlaybackRate.Display>`                                      | The current rate as text: "1.5x".                                                                                                                                                                   |
| `<ErrorMessage>`                                              | Renders its children in a live region while the track has failed to load.                                                                                                                           |
| `<MediaSession>`                                              | Publishes the track to the lock screen and the system media controls. Renders nothing. See [the guide](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/lock-screen.md). |

## Hooks

Every hook must be called inside an `<AudioPlayer>`, except
`useIsVolumeAvailable()`. See
[Custom UI with hooks](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/custom-ui.md).

| Hook                     | Returns                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAudioPlayer()`       | The state and the controls: `play`, `pause`, `seek`, `setVolume`, `setRate` and the rest.                                                      |
| `useCurrentSecond()`     | The position in whole seconds, re-rendering once a second. For a clock.                                                                        |
| `useCurrentTime()`       | The raw position, about four times a second. For a waveform.                                                                                   |
| `useTimeDisplay()`       | `elapsed` and `remaining` in whole seconds, for a readout of your own.                                                                         |
| `useIsSeekable()`        | Whether the duration is known. False before metadata and on a live stream.                                                                     |
| `useIsLive()`            | Whether the track is a live stream.                                                                                                            |
| `useIsBuffering()`       | Whether playback is waiting for data.                                                                                                          |
| `useIsAtEnd()`           | Whether the position is the end of the track.                                                                                                  |
| `useIsVolumeAvailable()` | Whether the browser lets a page set the volume. `false` on iOS.                                                                                |
| `useAudioError()`        | The last failure, or `null`. See [Errors and autoplay](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/recipes/errors.md). |

Not a hook, so it works anywhere: `formatTime(seconds)` formats a time the way
the readouts do, `M:SS`, or `H:MM:SS` from an hour up.

### Props hooks

Each returns the props of the part it is named for, to spread onto a
`<button>` of your own. Pass your props in the call and spread the result last.
See [Your own buttons](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/your-own-buttons.md).

| Hook                                    | Part                              |
| --------------------------------------- | --------------------------------- |
| `usePlayButtonProps(props)`             | `<PlayButton>`                    |
| `useMuteButtonProps(props)`             | `<MuteButton>`                    |
| `useSeekButtonProps(amount, props)`     | `<SeekButton>`                    |
| `useTimeToggleProps(defaultValue, …)`   | `<Time.Toggle>`                   |
| `usePlaybackRateSetProps(rate, …)`      | `<PlaybackRate.Set>`              |
| `usePlaybackRateChangeProps(amount, …)` | `<PlaybackRate.Change>`           |
| `usePlayerRootProps(props)`             | `<PlayerRoot>`, for any container |

## Keyboard shortcuts

On the focused control, or anywhere inside `<PlayerRoot>`; never page-wide.

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

A focused slider takes the arrow keys, `Home` and `End` for itself. To rebind
or unbind a key, see
[Keyboard](https://github.com/heinerbehrends/react-audio-player/blob/main/docs/keyboard.md).

## Roadmap

Additive, in the order they are likely to land. None changes what ships today.

- `<source>` fallback, widening `AudioFile` rather than changing it
- Playlist components, skip and loop
- Caption and subtitle support

## Development

```bash
pnpm test     # unit tests (jsdom)
pnpm testE2E  # end-to-end tests (Playwright)
```

## License

MIT
