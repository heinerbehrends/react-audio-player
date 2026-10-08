# Custom UI with hooks

For UI the components do not cover: a mini-player in a nav bar, a waveform,
analytics, resuming where the listener left off. Every hook must be called
inside an `<AudioPlayer>`, except `useIsVolumeAvailable()`.

## `useAudioPlayer()`

The player's state and controls in one object:

```jsx
function TrackInfo() {
  const { paused, duration, volume, playerState, play, pause } =
    useAudioPlayer();

  if (playerState === "loading") return <p>Loading…</p>;

  return (
    <button type="button" onClick={paused ? play : pause}>
      {paused ? "Play" : "Pause"} — {duration}s at {volume * 100}%
    </button>
  );
}
```

| Returns                                         |                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `duration`, `paused`, `volume`, `muted`, `rate` | Read straight off the element.                                                                |
| `playerState`                                   | `"loading" \| "error" \| "paused" \| "playing"`                                               |
| `volumeState`                                   | `"muted" \| "low" \| "high"`                                                                  |
| `isDisabled`                                    | The track is errored. Loading does not disable.                                               |
| `isSeekable`                                    | The duration is known. See `useIsSeekable()`.                                                 |
| `isLive`                                        | The track is a live stream. See `useIsLive()`.                                                |
| `isBuffering`                                   | Playback wants to advance and cannot. See `useIsBuffering()`.                                 |
| `error`                                         | The last failure, or `null`. See `useAudioError()`.                                           |
| `play`, `pause`, `toggle`, `stop`               | `stop` pauses and returns to the start.                                                       |
| `seek(seconds)`, `seekBy(seconds)`              | Absolute and relative; `seekBy` takes negatives. Both do nothing until the duration is known. |
| `setVolume(0–1)`, `adjustVolume(delta)`         | `setVolume(0)` mutes, exactly as dragging the slider to zero does.                            |
| `setMuted(muted)`, `toggleMute()`               | Unmuting restores the last audible volume.                                                    |
| `setRate(rate)`, `adjustRate(delta)`            | Clamped to `rateRange`.                                                                       |
| `reload()`                                      | Loads the track afresh, playing again if playback was still wanted.                           |

The control methods keep their identity for the lifetime of the player, so they
are safe in a dependency array. They are also what a [shortcut](keyboard.md#rebinding-and-unbinding)
receives. A component that only acts can take them from `useAudioControls()`,
which returns the controls alone and never re-renders.

## The position: `useCurrentSecond()` and `useCurrentTime()`

The playback position is not part of `useAudioPlayer()`: it changes about four
times a second, and every caller would re-render with it.

```jsx
const second = useCurrentSecond(); // whole seconds, re-renders once a second
const time = useCurrentTime(); // raw position, re-renders about 4 times a second
```

Use `useCurrentSecond` for anything a person reads, and `useCurrentTime` only
for something drawn continuously, such as a waveform.

`useCurrentSecond` is floored, so compare it with a floored time; see
[Chapters](recipes/chapters.md).

For a time readout of your own, `useTimeDisplay()` returns `elapsed` and
`remaining` in whole seconds, and `formatTime()` formats them the way the
built-in readouts do. See [What `time` cannot do](localisation.md#what-time-cannot-do).

## `useIsSeekable()`

Whether a position on the track can be named: the duration is known and
non-zero. It is the test that disables the timeline and the seek buttons, and
loading is not:

```jsx
function SkipButton() {
  const { seekBy } = useAudioPlayer();
  const seekable = useIsSeekable();

  return (
    <button type="button" aria-disabled={!seekable} onClick={() => seekBy(30)}>
      +30s
    </button>
  );
}
```

It is false on a live stream, whose `playerState` is a healthy `"playing"`.
Nothing else is gated on it: volume, mute, rate and `play()` all work before
metadata arrives.

## `useIsLive()`

Whether the track is a live stream. See [Live streams](recipes/live-stream.md).

## `useIsBuffering()`

Whether playback wants to advance and has no data: the spinner condition.

```jsx
function Spinner() {
  return useIsBuffering() ? <div className="spinner" /> : null;
}
```

It is independent of `playerState`, which stays `"playing"` through a stall, so
your button keeps offering Pause and pressing it still works.
`playerState === "loading"` means the track is on its way; `isBuffering` means
it ran out of data. Under `preload="none"` a player waiting for its first press
is `"paused"`, and the wait after the press is `isBuffering`. A track swap that
carries on playing starts a fresh load, so its wait is `"loading"`. Seeking
into unbuffered audio while paused does not count.

## `useIsAtEnd()`

Whether the position is the end of the track: for an end card, a Replay
button, or disabling "next".

```jsx
function Replay() {
  const { seek, play } = useAudioPlayer();

  if (!useIsAtEnd()) return null;

  return (
    <button
      onClick={() => {
        seek(0);
        play();
      }}
    >
      Replay
    </button>
  );
}
```

It is a statement about position, not history: dragging to the end reports
`true` with nothing played, and it clears as soon as the position moves. Use
`onEnded` for the moment the track finishes, and this for the state. It stays
`false` under `audioProps={{ loop: true }}`, where the element wraps to `0`.

## `useIsVolumeAvailable()`

Whether this browser lets a page set the volume. `false` on iOS, where the
hardware buttons own the level: `HTMLMediaElement.volume` ignores writes and
always reads `1`. `muted` still works.

`<Volume.Control>` is already `aria-disabled` there, so nothing breaks if you
ignore this. Use it to leave the slider out and keep `<MuteButton>`:

```jsx
function VolumeControls() {
  const available = useIsVolumeAvailable();

  return (
    <>
      <MuteButton>🔇</MuteButton>
      {available && <VolumeSlider />}
    </>
  );
}
```

It is the one hook that works outside `<AudioPlayer>`: it asks the browser, not
the player. On the server it reads `true`, and a hydrating client renders that
first and then corrects itself, so it causes no hydration mismatch.

## `useAudioError()`

The last failure, or `null`. See [Errors and autoplay](recipes/errors.md).
