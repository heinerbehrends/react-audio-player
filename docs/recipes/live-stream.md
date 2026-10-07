# A live stream

Live streams play. Play, pause, volume, mute and rate all work; the timeline
and the seek buttons are disabled, since there is no position to name, and
`duration` reads `0`, as it does before metadata.

The [live example](../../examples/live) is a radio player with a badge, a
buffering spinner and a reconnect.

## Mark MP3 and Opus streams as live

Firefox reports MP3 and Opus streams as a finite track whose duration grows as
it buffers, so the player cannot tell them from a file. Say it is live:

```jsx
<AudioPlayer audioFile={{ src: stationUrl, live: true }}>
```

Other streams are detected from their unbounded duration. Nothing overrides
`live`, and in a playlist it follows the current `audioFile`.

## Show that it is live

`useIsLive()` says the track is a live stream: for a "LIVE" badge, hiding the
clock, or swapping the timeline for something else.

```jsx
function Scrubber() {
  const live = useIsLive();

  if (live) return <span data-live>LIVE</span>;

  return (
    <Timeline>
      <Timeline.Control />
    </Timeline>
  );
}
```

It is not the inverse of `useIsSeekable()`. Both are `false` before metadata
arrives: that one says a position cannot be named yet, this one says it never
will be. Gate the timeline on the first and the badge on the second.

A stream that later reports a finite length, such as a recording that has
finished, stops being live, unless `audioFile.live` says otherwise.

## Pausing

Play after a pause rejoins the station live in Chromium and Firefox with most
servers, but a server that holds a paused connection open may resume where it
stopped. `currentTime` carries on from where it stopped either way, so it
counts listening time and says nothing about lag.

## Reconnecting

Nothing retries for you. `load()` on the element starts the stream afresh,
which for a station means live again, and clears the error:

```jsx
function Retry({ audioRef }) {
  const { play } = useAudioPlayer();
  const retry = () => {
    audioRef.current?.load();
    play();
  };
  return (
    <ErrorMessage>
      The station is not answering. <button onClick={retry}>Try again</button>
    </ErrorMessage>
  );
}
```

A connection that drops part-way through reports a `"network"` error once
playback stops on it. A connection that answers and then sends nothing raises
no error at all: the browser waits for good, and `useIsBuffering()` stays
`true`. How long to wait before retrying is yours to decide; the live example
reconnects after 15 seconds.

See [Errors and autoplay](errors.md) for the error types.
