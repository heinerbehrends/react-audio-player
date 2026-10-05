# Changelog

All notable changes to `react-headless-audio-player`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions
follow [Semantic Versioning](https://semver.org/).

Until 1.0 every release is published under the `beta` dist-tag, and the API can
change between betas. Anything that breaks a consumer is listed under
**Changed** or **Removed** in the release that does it.

## [0.1.0-beta.0] — unreleased

The first publish. Nothing was released before this version, so there is
nothing to migrate from.

### Added

- `<AudioPlayer>`: the root, with `audioFile`, `onEnded`, `labels`,
  `customKeyboardShortcuts`, `audioProps` and `audioRef`
- Compound components for the timeline, volume, playback-rate slider,
  playback-rate presets, time display and errors, plus `<PlayButton>`,
  `<MuteButton>` and `<SeekButton>`
- A props hook behind every button, for markup you already own
- `useAudioPlayer()`, `useAudioError()`, `useIsSeekable()`, `useIsLive()`,
  `useIsBuffering()`, `useIsAtEnd()`, `useCurrentSecond()` and
  `useCurrentTime()`
- `useIsVolumeAvailable()`, and a volume slider that disables itself where the
  browser ignores `volume` writes
- Keyboard shortcuts bound to every focused control, with `KeyToActionMap` to
  rebind or unbind them
- `labels` for every name and readout the library writes, with
  `PlayerLabels` and `TimePart` types
- `data-part` on every part and `data-state` where the DOM does not say it
- `--progress` and `--offset` custom properties on every slider root, for fills
  the inline transform cannot draw
- Track swaps carry on playing: a new `src` starts by itself if the player was
  playing or the track ended while playing, and stays paused otherwise
- `<MediaSession>`: the lock screen, media keys and system media controls, with
  metadata from `audioFile`, play, pause, skip and seek, a live scrubber, and
  `onPreviousTrack` / `onNextTrack`. Opt-in, so a player without it pays none of
  its bundle cost
- An optional stylesheet at `react-headless-audio-player/styles.css`
- A development-only error when a slider root is rendered without its
  `.Control`, stripped from production builds through `process.env.NODE_ENV`
- ESM-only build with a `"use client"` banner, `sideEffects: false`, types for
  React 18 and 19

### Known gaps

Documented in the README; each has a ticket under `issues/`.

- `volume` is inert on iOS, where the level is under the hardware buttons. The
  slider disables itself there and `useIsVolumeAvailable()` reports it; `muted`
  still works
- In Firefox a paused seek to the end of the track fires `onEnded`
- No `<source>` fallback yet; one format is loaded per track
- No part forwards a `ref`; `audioRef` reaches the `<audio>` element

[0.1.0-beta.0]: https://github.com/heinerbehrends/react-audio-player/releases/tag/v0.1.0-beta.0
