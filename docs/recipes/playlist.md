# A playlist

The player holds one track. Keep the list and the index in your own state, and
advance from `onEnded`. Changing `audioFile` reloads the element and resets
every value the player exposes.

```jsx
const tracks = [{ src: "one.mp3" }, { src: "two.mp3" }];

function Playlist() {
  const [index, setIndex] = useState(0);

  return (
    <AudioPlayer
      audioFile={tracks[index]}
      onEnded={() => setIndex((i) => Math.min(i + 1, tracks.length - 1))}
    >
      {/* Player UI components */}
    </AudioPlayer>
  );
}
```

The [playlist example](../../examples/playlist) adds previous and next buttons,
a track list and the lock screen.

In Firefox, dragging the thumb to the very end while paused also fires
`onEnded`, so the list advances; Chrome waits for playback to get there.

## Playing on across a change

If the player was playing, the new track starts by itself; if the user paused
it, it stays paused. A track that ran to its end counts as playing. So this
playlist plays through, and Previous after the last track plays too. A track
that fails to load does not stop the list; a browser that refuses autoplay
does. Next and previous buttons only change the index.

For a player that should rest at the end, call `pause()` from
`useAudioPlayer()` when `onEnded` does not advance. A pause ends the carry-on,
so a new `src` that is not navigation, such as a refreshed signed URL, arrives
paused.

## Starting a track from a list

To start a track from a paused player, such as a click in a track list, call
`play()` in the same handler as the change. The order does not matter; the
player remembers the request across the swap:

```jsx
// Rendered inside the player, where useAudioPlayer() is available.
function TrackButton({ index, title, select }) {
  const { play } = useAudioPlayer();
  const playTrack = () => {
    select(index);
    play();
  };
  return <button onClick={playTrack}>{title}</button>;
}
```

## Previous and next on the lock screen

`<MediaSession>` shows previous- and next-track buttons when you pass their
handlers. See [The lock screen](lock-screen.md).

## Keyboard

Inside [`<PlayerRoot>`](../accessibility.md#naming-the-player), the
[shortcuts](../keyboard.md) also work while focus is on your own previous and
next buttons.

## Ending by hand

In Firefox, dragging the timeline to the very end while paused also fires
`onEnded`, so a user can advance a playlist by hand; Chrome does not. The next
track arrives paused, since nothing was playing.
