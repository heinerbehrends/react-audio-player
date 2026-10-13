# Resume where the listener left off

Save the position as it moves, and start the next visit from it with `#t=` on
the URL. The browser does the second half: a media fragment on the `src`, such
as `episode.mp3#t=2530`, makes the track start at that second as soon as its
metadata arrives, before anything plays. No seek is needed, and nothing has to
wait for the duration.

The [podcast example](../../examples/podcast) does this with `localStorage`.

## Why not `seek()` on mount

`seek()` does nothing until the duration is known, the same rule that disables
the timeline. On mount that is after `loadedmetadata`, and under
`preload="none"`, which is the default on iOS, it is after the first press. A
`seek(saved)` in a mount effect is silently dropped. The fragment is applied
by the browser at the right moment, whatever `preload` is.

## Saving the position

`useCurrentSecond()` re-renders once a second as the position moves. Write it
when the duration is known, since before that the position reads `0` and would
overwrite the saved value, and write `0` at the end so the next visit starts
over:

```jsx
function RememberPosition({ id }) {
  const second = useCurrentSecond();
  const seekable = useIsSeekable();
  const atEnd = useIsAtEnd();

  useEffect(() => {
    if (seekable)
      localStorage.setItem(`position:${id}`, String(atEnd ? 0 : second));
  }, [id, seekable, second, atEnd]);

  return null;
}
```

Render it inside `<AudioPlayer>`. A write a second is cheap, and it is the only
reliable way: no unload event fires dependably on a phone.

## Starting from it

Read the saved position once, when the track is chosen, and put it on the URL:

```jsx
const saved = Number(localStorage.getItem(`position:${id}`)) || 0;
const src = saved > 0 ? `${url}#t=${saved}` : url;

<AudioPlayer track={{ src, title }}>
  <RememberPosition id={id} />
  {/* Player UI components */}
</AudioPlayer>;
```

The fragment is part of `src`, so a different value is a track change and
reloads the track. Set it when the track is chosen, as a playlist does for each
track, not while it plays; later jumps are `seek()`.

A value past the end is clamped by the browser. `#t=10,20` plays a clip and
pauses at 20 seconds.

## Deep links

A link into an episode is the same mechanism: read `t` from the page's query
string and put it on the `src`.

```jsx
const t = Number(new URLSearchParams(location.search).get("t")) || 0;
```

## A source fed by another library

A fragment is read by the browser from the `src` attribute. A player driving
the element through HLS.js or dash.js sets the start position in that
library's own options instead; see
[The `<audio>` element](audio-element.md).
