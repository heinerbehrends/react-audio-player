# The `<audio>` element

`<AudioPlayer>` renders the `<audio>` element itself. Anything the library does
not model goes through `audioProps`, and `<track>` captions through its
`children`:

```jsx
<AudioPlayer
  audioFile={{ src: "audio.mp3" }}
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
are `audioFile.src` and the `onEnded` prop.

Use `audioRef` for anything that needs the element itself: Web Audio,
HLS.js or dash.js, a retry through `load()`, or every `buffered` range. Prefer
a stable ref; an inline callback re-runs the forwarding effect on every render.

## One format per track

One source is loaded per track. `<source>` fallback is planned, and will widen
the type rather than change it:

```ts
type AudioSource = { src: string; type?: string };
type AudioFile = AudioSource | { sources: AudioSource[] };
```

Everything passing `{ src }` today keeps working unchanged.
