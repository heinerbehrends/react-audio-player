# The lock screen and media keys

`<MediaSession>` publishes the player to the operating system's media
controls: the lock screen, the notification shade, the desktop media overlay,
headphone buttons and car head units. It renders nothing. Leave it out for a
sound effect, a preview clip or a notification chime, which should not take
over the lock screen.

```jsx
<AudioPlayer audioFile={{ src, title, artist, album, artwork }}>
  <MediaSession
    onPreviousTrack={() => setIndex((i) => i - 1)}
    onNextTrack={() => setIndex((i) => i + 1)}
  />
  {/* the rest of the UI */}
</AudioPlayer>
```

| Prop              | Type         | Description                                                                                                         |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `onPreviousTrack` | `() => void` | Shows a previous-track button and runs when it is pressed. Without it, there is no button.                          |
| `onNextTrack`     | `() => void` | Shows a next-track button and runs when it is pressed. Without it, there is no button.                              |
| `seekOffset`      | `number`     | Seconds the system's skip buttons move, in both directions, when the system does not name a distance. Default `10`. |

The [playlist example](../../examples/playlist) uses it.

## The card

The card shows `title`, `artist`, `album` and `artwork` from `audioFile`. With
none of them set there is no card text, rather than "Untitled". An artwork
`src` the browser rejects as a URL drops the card and logs an error in
development; the player keeps working.

## The buttons

Play, pause, the skip buttons and the scrubber drive the player through the
same actions as the keyboard shortcuts, so a live stream ignores the skips as
it ignores `<SeekButton>`. The scrubber follows the position, duration and
rate.

Previous and next are yours to handle, since the player holds one track; see
[A playlist](playlist.md). On iOS the lock screen shows either track or time
skips, not both, so passing `onNextTrack` replaces the skip-time buttons there;
Chrome on Android shows both. There is no stop action: the close button on
Chrome's desktop media controls pauses.

## Several players

The browser has one media session per page. With several `<MediaSession>`
parts, the session belongs to the player that most recently started playing,
and stays with it while paused; before anything plays, the first one mounted
holds it. When the owner unmounts, the session is cleared, and the others wait
until one of them plays, so a player still playing at that moment shows a
blank card until it is paused and played again. A `<MediaSession>` rendered
into a player that is already playing, while another player owns the session,
takes over on its next play, not on mount.

Where the browser has no Media Session API, it does nothing.
