# Keyboard

## Where the shortcuts work

The shortcuts work on every focusable library control. Inside
[`<PlayerRoot>`](accessibility.md#naming-the-player) they reach every control,
your own included, such as a playlist's previous and next buttons, and work
after a click anywhere on the player.

They work only while focus is inside the player; they are never page-wide. Keys
pressed in an `<input>` (a checkbox included), `<textarea>`, `<select>` or
`contenteditable` are left alone, and a key a library control already handled
stops there, so nothing runs twice.

## Default bindings

| Keys             | Action                     |
| ---------------- | -------------------------- |
| `p`, `k`         | Play/pause                 |
| `s`              | Stop and return to start   |
| `m`              | Mute/unmute                |
| `←` / `→`        | Seek 5 seconds             |
| `j` / `l`        | Seek 10 seconds            |
| `↑` / `↓`        | Volume by 0.025            |
| `<` `>`, `[` `]` | Playback rate by 0.05      |
| `Backspace`      | Reset the rate to 1x       |
| `0`–`9`          | Jump to 0–90% of the track |

Media keys (`MediaPlayPause`, `MediaStop`, `MediaMute`, `MediaVolumeUp`,
`MediaVolumeDown`) map to the same actions. Combinations with Ctrl, Cmd or Alt
are left to the browser and to assistive technology.

On a focused slider the arrow keys adjust its value instead, and `Home` and
`End` jump to the ends of its range. Those two are slider-only: everywhere else
they stay the browser's.

The rate keys stop at the ends of `<AudioPlayer>`'s `rateRange`, `0.5`–`4` by
default, as every other rate control does.

`Space` keeps activating the focused button. On `<PlayerRoot>` it plays and
pauses while the root itself has focus, say after a click on the cover, where
it would otherwise scroll the page.

## Rebinding and unbinding

`shortcuts` is merged over the defaults, so a key you do not name
keeps its binding. A binding is a function, given what `useAudioPlayer()`
returns at the moment the key is pressed, or `null` to unbind the key and let it
reach the browser. Letters match either case, so `p: null` unbinds Shift+P too:

```jsx
<AudioPlayer
  track={track}
  shortcuts={{
    p: null,
    f: ({ seekBy }) => seekBy(30),
    r: ({ reload }) => reload(),
  }}
>
```

Bind `" "` to change what Space does on `<PlayerRoot>`, or set it to `null` to
leave Space alone there too.

The [custom-components example](../examples/custom-components) rebinds five
keys and unbinds one in its `shortcuts.ts`, and builds the list it shows beside
the player from the same array as the map.

The map is player-wide rather than per control: a key that works on one button
and not its neighbour would be a bug.

To skip a shortcut on one control only, call `preventDefault()` in that
control's `onKeyDown`; your handler runs first. On a `<button>` that also
cancels `Enter` and `Space` activation, so check the key first.
