---
id: F16
title: "Headless controls that also drive a `<video>`"
epic: features
status: open
severity: none
origin: backlog
breaking: false
---

A possible feature, not a decision. The library could drive a `<video>` the
consumer renders, so a simple self-built video player gets the same controls an
audio player does. It would not become a video player: the video experience
stays the consumer's.

## Why it is cheap

Most of the core is already media-agnostic. The sync layer and the store read a
generic `SyncableMediaElement`. Play, pause, seek, volume, rate, buffering,
errors, live detection, the keyboard shortcuts and `<MediaSession>` behave the
same on a `<video>`. Four files name `HTMLAudioElement`: `AudioElement.tsx`,
`handleSideEffect.ts`, `AudioPlayer.tsx` and `createPlayerStore.ts`.

## What the library would change

- Widen those types to `HTMLMediaElement`.
- Render or attach a `<video>`: `poster`, `playsInline` (without it iOS jumps to
  fullscreen) and sizing are the consumer's, through the element's props.
- Defaults that say "video": the play button announces "Play audio" today, so
  every video player would have to override `labels`.
- Neutral names alongside the audio ones: `<MediaPlayer>`, `mediaRef`.
  `<AudioPlayer>`, `track` and `audioRef` stay, so nothing breaks.
- Measure the cost on "AudioPlayer only", which has almost no headroom; an
  audio player must not pay for video.

Estimate: about two days.

## What stays the consumer's

Layout, the poster, controls over the picture and hiding them on idle,
fullscreen (`requestFullscreen()` on their own container), picture-in-picture
(`requestPictureInPicture()`), click on the picture to play, and captions. A
`<track>` child already renders captions natively; a custom captions menu is
theirs. Video keys such as `f` go through `<PlayerRoot>`'s `onKeyDown`, which
runs before the library's.

Two limits to state up front: in iOS fullscreen Safari shows its own controls
and hides any custom ones, and WCAG requires captions for prerecorded video,
which the consumer has to provide.

## Proof

A **video** example: a player with controls over the picture, fullscreen and a
captions track, on the demo page with one E2E test. About a day. It follows
G4's rule that an example beats README code.

## Positioning

**D9** lists "no video" among the deliberate refusals. This would change that
to "video works; the video experience is yours". Building fullscreen, captions
UI or quality menus into the library stays out: Vidstack and Media Chrome
already do that, and this library's niche is small, accessible, audio-first
parts.

## Idea: a second package on a shared core

Instead of one package, a monorepo: a core package (the store, the sync
layer, the sliders and buttons), `react-headless-audio-player` on top of it as
today, and a `react-headless-video-player` beside it. The video package would
have a name people search for, "video" defaults, and room for video-only parts
such as a fullscreen button or a captions toggle, without the audio package
ever shipping them.

The cost is the monorepo itself: workspaces, a build and a bundle budget per
package, coordinated releases, and docs split across the packages. The core is
already largely separate (`store/`, `Slider/` and `Shared/` do not know about
audio), so the split could also come later without breaking the audio package.
