# A transcript

Audio has no picture to put captions on. What a listener needs is the
transcript: the whole text on the page, readable at their own speed, with the
sentence playing now marked and a click on any sentence to hear it. Prerecorded
audio needs one to meet WCAG 1.2.1. The [podcast example](../../examples/podcast)
has one.

Each sentence is a `<button>`, so the transcript seeks from the keyboard too;
style it as text, with `display: inline` and no border or background.

## From your own data

A transcript you hold as data needs no hook: a sorted list of cues,
`useCurrentSecond()` and `seek()`, the same as a
[chapter list](chapters.md). It renders on the server, so the text is in the
HTML for search engines and for anyone who never presses play.

```jsx
function Transcript({ cues }) {
  const second = useCurrentSecond();
  const { seek } = useAudioControls();
  const active = cues.findLastIndex((cue) => Math.floor(cue.start) <= second);

  return (
    <p className="transcript">
      {cues.map((cue, i) => (
        <Fragment key={cue.start}>
          <button
            type="button"
            aria-current={i === active ? "true" : undefined}
            onClick={() => seek(cue.start)}
          >
            {cue.text}
          </button>{" "}
        </Fragment>
      ))}
    </p>
  );
}
```

## From a WebVTT file

Podcast hosts hand out transcripts as `.vtt` files. Pass the file as a `<track>`
child of the `<audio>` element, and read it with `useTextTrack()`:

```jsx
<AudioPlayer
  track={{ src: "episode.mp3" }}
  audioProps={{
    children: <track kind="subtitles" src="episode.vtt" srcLang="en" default />,
  }}
>
  <Transcript />
</AudioPlayer>
```

```jsx
function Transcript() {
  const { cues, activeIndex, status } = useTextTrack();
  const { seek } = useAudioControls();
  if (status !== "ready") return null;

  return (
    <p className="transcript">
      {cues.map((cue, i) => (
        <Fragment key={cue.start}>
          <button
            type="button"
            aria-current={i === activeIndex ? "true" : undefined}
            onClick={() => seek(cue.start)}
          >
            {cue.text}
          </button>{" "}
        </Fragment>
      ))}
    </p>
  );
}
```

On `<audio>` the browser fetches and parses the file but draws nothing; the
hook makes it React data. `cues` are plain objects, `{ id, start, end, text }`,
with the VTT markup stripped. `activeIndex` follows the playhead from the
browser's `cuechange`, so the transcript re-renders once a sentence rather than
once a second, and is `-1` between cues.

`status` is `"loading"` until the file arrives, then `"ready"`, or `"error"`
for a missing or unparseable file; `"none"` means no matching `<track>`. A new
`src` on the `<track>`, for the next episode, is `"loading"` again, with no
cues until that file arrives. The hook reads `"subtitles"`, else `"captions"`: pass `{ kind }` for another kind,
such as `"chapters"`, and `{ language }` to choose between several tracks.
Without `language` it reads the one marked `default`, else the first.

Things the file route does differently:

- **It loads on the client.** The text appears after the page loads, not in
  the server HTML.
- **Another origin needs CORS.** A `.vtt` file on another origin needs
  `crossOrigin` on the element, through `audioProps`, and a CORS header on
  that server.
- **Paragraphs are yours to mark.** A cue's `id` is its identifier in the file;
  give the first cue of each paragraph one, and start a new paragraph there.
- **`useTextTrack()` is a separate import**, so a player without a transcript
  does not pay for it.

## Following along

Scrolling the active sentence into view is a toggle the reader turns on, never
the default: it fights anyone reading ahead.

```jsx
const [follow, setFollow] = useState(false);
const activeRef = useRef(null);

useEffect(() => {
  if (follow) activeRef.current?.scrollIntoView({ block: "nearest" });
}, [follow, activeIndex]);
```

## A caption line

A caption line is the one-cue case: render `cues[activeIndex]?.text` under the
player. Offer it alongside a transcript, not instead of one.
