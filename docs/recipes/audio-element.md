# The `<audio>` element

`<AudioPlayer>` renders the `<audio>` element itself. Anything the library does
not model goes through `audioProps`, and `<track>` captions through its
`children`:

```jsx
<AudioPlayer
  track={{ src: "audio.mp3" }}
  audioProps={{
    preload: "none",
    // Required for Web Audio: without it `createMediaElementSource` taints.
    crossOrigin: "anonymous",
    children: <track kind="captions" src="captions.vtt" srcLang="en" default />,
  }}
  audioRef={audioRef}
>
  {/* Player UI components */}
</AudioPlayer>
```

`audioProps` takes every `<audio>` attribute except `src` and `onEnded`, which
are `track.src` and the `onEnded` prop.

Use `audioRef` for anything that needs the element itself: Web Audio,
HLS.js or dash.js, or every `buffered` range. Prefer
a stable ref; an inline callback re-runs the forwarding effect on every render.

## One format per track

One source is loaded per track; `<source>` children are not supported. Every
current browser plays MP3 and AAC, so one file is usually enough. To serve a
smaller format where it plays, pick the file before passing it:

```jsx
const opus = new Audio().canPlayType('audio/ogg; codecs="opus"') !== "";

<AudioPlayer track={{ src: opus ? track.opus : track.mp3, title: track.title }}>
```

Unlike `<source>`, this does not move on to the next file when the first one
fails to load.
