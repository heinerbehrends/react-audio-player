# Chapters and the playhead

The [podcast example](../../examples/podcast) has a chapter list, chapter
gaps in the timeline, a buffered bar and an end card.

## The current chapter

`useCurrentSecond()` is the position in whole seconds, re-rendering once a
second. It is floored, so compare it with a floored time: a chapter that starts
at 115.75 reads 115 right after a seek to it, and `start <= second` would still
mark the chapter before.

```js
const second = useCurrentSecond();
const current = chapters.findLastIndex(
  (chapter) => Math.floor(chapter.start) <= second,
);
```

## Jumping to a chapter

`seek(seconds)` from `useAudioPlayer()` moves the playhead:

```jsx
const { seek } = useAudioPlayer();

<button onClick={() => seek(chapter.start)}>{chapter.title}</button>;
```

Markers placed along the timeline need the duration, which is `0` until
metadata arrives; read it from `useAudioPlayer()`.

## How much has downloaded

`<TimelineBuffered>` draws how much has downloaded ahead of the position,
behind the fill. It is a separate import, so a player without it does not pay
for it. Render it inside `<Timeline.Control>`:

```jsx
<Timeline>
  <Timeline.Control>
    <Timeline.Background />
    <TimelineBuffered />
    <Timeline.Progress />
  </Timeline.Control>
  <Timeline.Thumb />
</Timeline>
```

It draws the downloaded range the position is in, not every range: after a seek
ahead, the earlier download is not drawn. It is empty before metadata and on a
live stream. For every range, read `buffered` from the element through
`audioRef`.

## At the end

`useIsAtEnd()` is `true` while the position is the end of the track: for an end
card or a "Play again" button. See [`useIsAtEnd()`](../custom-ui.md#useisatend).
