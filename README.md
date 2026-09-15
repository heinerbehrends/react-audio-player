# React Headless Audio Player (in development)

A headless, accessible audio player for React: compound components that give you
behaviour, semantics and state, while you supply all of the markup and styling.
For the parts you would rather build yourself, each button also ships as a props
hook.

There is no `asChild`. Radix's merge rule is child-props-win, which would invert
every lock this library spreads last — `role="slider"`, `tabIndex={-1}`,
`aria-hidden`, the `aria-disabled` click gate — and naming a `Slot` would cost
bundle size for consumers who never use it. The [props hooks](#props-hooks) cover
the same ground without either.

## Features

- 🎨 Unstyled — every part takes your own `className` and `style`
- 🧩 Compound components, placed anywhere in your own layout
- 🪝 A props hook behind every button, for markup you already own
- 🎯 `data-part` on every part, and `data-state` where the DOM does not say it
- 🎛️ Play/pause, mute, seek, volume and playback rate
- ⌨️ Keyboard shortcuts, ARIA slider semantics and screen reader announcements
- ✔️ No dependencies beyond React 18

## Basic usage

```jsx
import {
  AudioPlayer,
  PlayButton,
  Timeline,
  Volume,
} from "react-headless-audio-player";

function App() {
  return (
    <AudioPlayer audioFile={{ src: "audio-file.mp3" }}>
      <Timeline>
        <Timeline.Control>
          <Timeline.Progress />
        </Timeline.Control>
        <Timeline.Thumb />
      </Timeline>

      <PlayButton>
        <PlayButton.Playing>Pause</PlayButton.Playing>
        <PlayButton.Paused>Play</PlayButton.Paused>
      </PlayButton>

      <Volume>
        <Volume.Control>
          <Volume.Progress />
        </Volume.Control>
        <Volume.Thumb />
      </Volume>
    </AudioPlayer>
  );
}
```

## Accessibility

Each slider exposes one focusable `role="slider"` element that carries the
`aria-value*` attributes and takes the arrow keys, plus `Home` and `End`. The
drag thumbs are pointer affordances only: they are `aria-hidden` and out of the
tab order, so a slider announces one value rather than two.

A slider root is a plain `<div>` with no role of its own. The parts inside it
are the slider, its fill and its thumb — one control, already named — so a
wrapper role would announce a group of one. `<PlaybackRate>` is the exception
and keeps `role="group"`, because it wraps several buttons. If you compose other
controls into a slider root, add your own `role="group"` and `aria-label`; props
are spread through.

The volume slider announces the mute as well as the volume — "Muted, 80%" — since
the two are separate on the element and the arrow keys change the volume without
unmuting.

Each control says its state in exactly one place.

For the three toggles that is the **name**, which changes with the state:
`<MuteButton>` is "Mute" or "Unmute", `<PlayButton>` is "Play audio", "Pause
audio", "Loading audio" or "Error loading audio", and `<Time.Toggle>` is "Show
time elapsed" or "Show time remaining". None of them sets `aria-pressed` — a
name that already says which way the toggle will go, plus a pressed state saying
it has already gone, announces as a contradiction ("Unmute, toggle button,
pressed").

For `<PlaybackRate.Set>` it is **`aria-pressed`**, because its name does not
move: "Set playback rate to 1.5x" reads the same whether or not that rate is in
effect, so the name has no state to carry. The rate in effect is
`aria-pressed="true"` and the others are `"false"` rather than absent, so the
row announces as a set of choices rather than as unrelated buttons.

Pass your own `aria-label` to override any of them.

Your handlers run alongside the library's rather than replacing them — yours
first, ours second, and `preventDefault()` in yours opts out of ours. On a
`<button>` that also cancels `Enter` and `Space` activation, so scope it to the
key you are handling; to turn a media shortcut off, unbind it with
`customKeyboardShortcuts` instead.

An unavailable control is marked `aria-disabled` and does nothing when
activated, your own `onClick` included — so style that state from
`[aria-disabled="true"]`, never `:disabled`. The native attribute is deliberately
unused: it takes the control out of the tab order, so a `src` swap under a
focused control would drop focus to `<body>`.

**Loading does not make a control unavailable.** `play()`, the volume, the mute
and the rate all work before metadata arrives, and a track change re-enters
loading, so disabling there would swallow the first press on every playlist
advance. An error disables everything; missing a duration disables only the
timeline and the seek buttons, which are the two things that have to name a
position on the track.

Errors render into a live region. Every control also accepts the global media
shortcuts while focused, whether or not it is disabled: the shortcuts belong to
the player, not to the control. A slider's own arrow keys are the exception —
those stop while it is disabled.

**These promises hold for the components.** The [props hooks](#props-hooks) hand
you the same attributes and let you decide where they go, so spreading the bag
before your own props — or onto something that is not a `<button>` — can defeat
the disabled gate or the semantics. Spread it last, onto a `<button>`, and you
get everything above.

## Components

### `<AudioPlayer>`

The root. Creates the store, renders the `<audio>` element, and provides both to
everything below it.

```jsx
<AudioPlayer audioFile={{ src: "audio.mp3" }}>
  {/* Player UI components */}
</AudioPlayer>
```

| Prop                      | Type                    | Description                                                                                       |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `audioFile`               | `AudioFile`             | The track to play. Required.                                                                      |
| `onEnded`                 | `() => void`            | Called once when the track finishes, after the element has been returned to the start.            |
| `customKeyboardShortcuts` | `KeyToActionMap`        | Merged over the defaults, so a key you do not name keeps its default binding; `null` unbinds one. |
| `audioProps`              | `AudioHTMLAttributes`   | Forwarded to the underlying `<audio>`. Excludes `src` and `onEnded`, which have dedicated props.  |
| `audioRef`                | `Ref<HTMLAudioElement>` | A ref to the `<audio>` element itself.                                                            |

```ts
type AudioFile = {
  src: string;
  // Metadata is accepted but not read yet. It is declared now so that adding
  // Media Session support later is not a breaking change.
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
};
```

#### Reaching the `<audio>` element

Anything the library does not model goes through `audioProps`, and `<track>`
captions through its `children`:

```jsx
<AudioPlayer
  audioFile={{ src: "audio.mp3" }}
  audioProps={{
    preload: "none",
    // Required for Web Audio — without it `createMediaElementSource` taints.
    crossOrigin: "anonymous",
    children: <track kind="captions" src="captions.vtt" srcLang="en" default />,
  }}
  audioRef={audioRef}
>
  {/* Player UI components */}
</AudioPlayer>
```

Use `audioRef` for anything that needs the element itself: Web Audio,
HLS.js/dash.js, or the Media Session API. Prefer a stable ref — an inline
callback re-runs the forwarding effect on every render.

One format is loaded per track; `<source>` fallback is not supported yet (see
`issues/`).

#### Playlists

The player holds one track. Keep the list and the index in your own state and
advance it from `onEnded`. Swapping `audioFile` reloads the element and
re-primes every value the player exposes.

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

### Timeline

`<Timeline step={5}>` is the root and takes an optional arrow-key step in
seconds; its maximum is the track duration, so it takes no `maxValue`.

- `<Timeline.Control>` — the focusable slider: click to seek, arrow keys to step
- `<Timeline.Progress>` — the filled part of the track
- `<Timeline.Background>` — the track behind the fill
- `<Timeline.Thumb>` — the draggable thumb

### Playback controls

- `<PlayButton>` — toggles play and pause
- `<PlayButton.Playing>` — renders its children while playing
- `<PlayButton.Paused>` — renders its children while not playing
- `<MuteButton>` — toggles mute
- `<MuteButton.Muted>` — renders its children while muted
- `<MuteButton.LowVolume>` — renders its children below half volume
- `<MuteButton.HighVolume>` — renders its children at or above half volume
- `<SeekButton amount={10}>` — jumps by `amount` seconds; negative rewinds

### Volume

`<Volume orientation="horizontal | vertical">` is the root. A vertical slider
runs bottom to top.

- `<Volume.Control>` — the focusable slider: click to set, arrow keys to step
- `<Volume.Progress>` — the filled part of the track
- `<Volume.Background>` — the track behind the fill
- `<Volume.Thumb>` — the draggable thumb

Reaching zero mutes, by any route — drag, click, keyboard or `setVolume(0)`.
Unmuting restores the volume the player was last audible at.

### Time display

- `<Time.Elapsed>` — position, while the display is showing elapsed time
- `<Time.Remaining>` — time left, while the display is showing remaining time
- `<Time.Duration>` — track length
- `<Time.Toggle>` — switches between elapsed and remaining

### Playback rate

- `<PlaybackRate>` — groups the rate controls
- `<PlaybackRate.Display>` — the current rate
- `<PlaybackRate.Set rate={1.5}>` — sets that rate
- `<PlaybackRate.Current rate={1.5}>` — marks that rate as the current one. Its
  children are always rendered, in a `<span>` that is `visibility: hidden` while
  the rate is not current, so the marker reserves its space in both states and
  the row does not reflow as it moves
- `<PlaybackRate.Change amount={0.1}>` — adjusts the rate by `amount`

`<PlaybackRate.Set>` is **not** clamped to the slider's range: it names an
explicit rate, so `rate={8}` sets 8 where `<PlaybackRateSlider>` stops at 4. The
write path clamps to the element's own 0–16, so nothing throws. `.Change` and the
`<` `>` keys clamp to the library's 0.5–4.

### Playback rate slider

`<PlaybackRateSlider minValue={0.5} maxValue={4} step={0.1}>` is the root. Those
are the defaults; pass `step={0}` for a continuous slider.

- `<PlaybackRateSlider.Control>` — the focusable slider
- `<PlaybackRateSlider.Progress>` — the filled part of the track
- `<PlaybackRateSlider.Background>` — the track behind the fill
- `<PlaybackRateSlider.Thumb>` — the draggable thumb

### Errors

- `<ErrorMessage>` — renders its children in a live region while the track has
  failed to load, and nothing otherwise

## Styling

Every part takes `className` and `style`. Every part also carries a `data-part`
attribute, so you can style from plain CSS without threading a class through
every element:

| Part                     | `data-part`    |
| ------------------------ | -------------- |
| `<PlayButton>`           | `play`         |
| `<MuteButton>`           | `mute`         |
| `<SeekButton>`           | `seek`         |
| `<Time.Toggle>`          | `time-toggle`  |
| `<Time.Elapsed>`         | `elapsed`      |
| `<Time.Remaining>`       | `remaining`    |
| `<Time.Duration>`        | `duration`     |
| `<PlaybackRate>`         | `root`         |
| `<PlaybackRate.Set>`     | `rate-set`     |
| `<PlaybackRate.Change>`  | `rate-change`  |
| `<PlaybackRate.Display>` | `rate-display` |
| `<ErrorMessage>`         | `error`        |
| a slider root            | `root`         |
| `.Control`               | `control`      |
| `.Progress`              | `progress`     |
| `.Background`            | `background`   |
| `.Thumb`                 | `thumb`        |

```css
/* Scope to your own container: all three sliders share these part names. */
.player [data-part="progress"] {
  background: rebeccapurple;
}
```

`data-part` is what `aria-label` cannot be. The label is the documented way to
localise a control, so `button[aria-label="Play audio"]` is a selector that
breaks the day you ship in German. A part name does not move.

### State attributes

**An attribute exists where the element does not already carry the
information.** That rule is why the list is this short, and why some states you
might look for are spelled in ARIA instead:

| State                         | Read it from                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| play/pause/loading/error      | `[data-part="play"][data-state="playing"]`                          |
| muted/low/high volume         | `[data-part="mute"][data-state="muted"]`                            |
| which time readout is showing | `[data-part="time-toggle"][data-state="elapsed"]`                   |
| a slider being dragged        | `[data-part="root"][data-state="dragging"]`                         |
| a slider's axis               | `[data-part="root"][data-orientation="vertical"]`                   |
| **unavailable**               | `[aria-disabled="true"]` — not `data-disabled`, and not `:disabled` |
| **the rate in effect**        | `[aria-pressed="true"]` on `.Set` — not `data-state`                |

There is deliberately no `data-disabled`: every button and `.Control` already
renders `aria-disabled`, and a second spelling of one state is one more thing to
keep in agreement. A slider root carries no disabled signal of its own, and
still does not need one — `[data-part="root"]:has([aria-disabled="true"])`
reaches it from the control inside.

Drag state lives on the slider **root**, not on the thumb: it is a property of
the slider, and every part is a descendant, so one attribute reaches all of
them.

```css
[data-part="root"][data-state="dragging"] [data-part="thumb"] {
  transform: scale(1.2);
}
```

`data-orientation` is on the root for the reason that makes it worth having at
all: `aria-orientation` sits on `.Control`, a child, where a root-level layout
rule cannot see it.

The state values are API — renaming `loading` would break your stylesheet — so
they are named in the props hooks' return types as well.

### The optional stylesheet

`.Control` is a `<button>`, so without a reset it renders with the browser's own
button chrome. The library ships those defaults as a stylesheet rather than
inline, because an inline style outranks every rule you could write:

```js
import "react-headless-audio-player/styles.css";
```

It sets three things: `width: 100%` on the root, the button reset on
`.Control`, and `cursor: grab` on `.Thumb`. Every rule is one selector deep, so
a single class of your own overrides it as long as your CSS loads afterwards.
Skip the import and you get no styling at all from the library beyond the
structural output below — which is the point of it being optional.

### What stays inline

`transform`, `transform-origin`, grid placement, `position`, `touch-action` and
`z-index` — plus the width and height that make the progress fill's `scaleX()`
mean anything. These are computed from the current value, so they are output
rather than opinion. Inline styles beat any stylesheet rule, so override these
through the `style` prop, which is merged last and wins.

The three slider layers stack in one order: `.Background` at `z-index: 0`,
`.Progress` at `1`, `.Thumb` at `2`, whatever order you write them in. It is
declared rather than left to the fill's `transform`, so overriding that
transform does not put the background on top.

**A slider root needs a height.** It has none of its own, and a zero-height
track measures zero, which leaves the slider silently inert. Each slider's own
tooltip repeats this, since it is the mistake that produces no error at all.

## Props hooks

For when you already have a styled `<button>` of your own and want this
library's behaviour on it rather than its markup. Each of the six buttons is a
one-liner over its hook, so the hook gives you exactly what the component
renders:

```jsx
import { usePlayButtonProps } from "react-headless-audio-player";

function PlayPause() {
  return <MyButton {...usePlayButtonProps()}>▶</MyButton>;
}
```

| Hook                         | Component               | Extra argument |
| ---------------------------- | ----------------------- | -------------- |
| `usePlayButtonProps`         | `<PlayButton>`          | —              |
| `useMuteButtonProps`         | `<MuteButton>`          | —              |
| `useSeekButtonProps`         | `<SeekButton>`          | `amount`       |
| `useTimeToggleProps`         | `<Time.Toggle>`         | —              |
| `usePlaybackRateSetProps`    | `<PlaybackRate.Set>`    | `rate`         |
| `usePlaybackRateChangeProps` | `<PlaybackRate.Change>` | `amount`       |

Each returns the accessible name, `type`, `data-part`, the click handler, the
media-key handler and the `aria-disabled` gate — plus `data-state` on the three
that have one, and `aria-pressed` on `.Set`.

**Pass your props in, don't add them after.** The bag composes them:

```jsx
<MyButton {...usePlayButtonProps({ onClick: track, className: "btn" })} />
```

Your handlers run first and the library's second, and `preventDefault()` in
yours opts out of ours. Adding `onClick` after the spread replaces the library's
instead, which silently breaks playback; passing it in is the only spelling that
composes. Where `amount` or `rate` is needed it is a leading argument rather than
a key of the bag, because React would pass an unrecognised lowercase attribute
through to the DOM — `<button rate="1.5">` in your page source.

**Spread the bag last.** The gate, the handlers and `type` are the library's and
cannot be overridden; the name, `data-part` and `data-state` sit in front of your
props, so you can replace those. Spread the bag first and your own props can
spread the gate away — which is the one way to defeat the accessibility
guarantees below.

There are no slider hooks, and there will not be. A design system has a button;
none has an audio scrubber, so there is no existing element to spread onto. The
bag would have to return a `ref` — spreading a `ref` onto a function component on
React 18 warns and drops it, leaving an unmeasured track that renders normally
and ignores every click. Use `<Timeline>` and `<Volume>`, whose `.Control` takes
`children`, `className` and `style` and composes handlers the same way.

## Hooks

For UI the components do not cover: a mini-player in a nav bar, a waveform,
analytics, resuming where the listener left off. All of these must be called
inside an `<AudioPlayer>`.

### `useAudioPlayer()`

Returns the player's state and its controls in one flat object.

```jsx
function TrackInfo() {
  const { paused, duration, volume, playerState, play, pause, seekBy } =
    useAudioPlayer();

  if (playerState === "loading") return <p>Loading…</p>;

  return (
    <button type="button" onClick={paused ? play : pause}>
      {paused ? "Play" : "Pause"} — {duration}s at {volume * 100}%
    </button>
  );
}
```

| Returns                                           |                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `duration`, `paused`, `volume`, `muted`, `rate`   | Read straight off the element.                                     |
| `playerState`                                     | `"loading" \| "error" \| "paused" \| "playing"`                    |
| `volumeState`                                     | `"muted" \| "low" \| "high"`                                       |
| `isDisabled`                                      | The track is errored. Loading does not disable — see below.        |
| `isSeekable`                                      | A position on the track can be named: the duration is known.       |
| `isBuffering`                                     | Playback wants to advance and cannot — the spinner condition.      |
| `error`                                           | The last failure, or `null`. See `useAudioError()`.                |
| `play`, `pause`, `toggle`                         |                                                                    |
| `seek(seconds)`, `seekBy(seconds)`                | Absolute and relative. `seekBy` takes negatives.                   |
| `setVolume(0–1)`, `toggleMute()`, `setRate(rate)` | `setVolume(0)` mutes, exactly as dragging the slider to zero does. |

The control methods keep the same identity for the lifetime of the player, so
they are safe to put in a dependency array.

### `useAudioError()`

Playback fails in two ways that need different handling, so they are reported
as a discriminated union rather than one flag:

```ts
type AudioError =
  | {
      kind: "media";
      reason: "aborted" | "network" | "decode" | "unsupported" | "unknown";
    }
  | { kind: "playback"; reason: string };
```

`kind: "media"` comes from the element's own `MediaError` — the resource is
unusable, and only a retry or a different `src` will help. `"network"` is worth
retrying; `"unsupported"` is not.

Reported only when the element also has no data to play, which is what a browser
reports for a source it cannot use. An `error` raised by an element that still
holds a buffer is ignored, because such an element can and does keep playing:
Firefox on a machine with no audio output device raises `MEDIA_ERR_DECODE`
milliseconds after `play()` and then plays the track to the end.

`kind: "playback"` means the resource is fine and the browser refused the
command. `reason` is the `DOMException` name, almost always
`"NotAllowedError"` — autoplay policy, which any user gesture lifts:

```jsx
function PlayPrompt() {
  const { error, play } = useAudioPlayer();

  if (error?.kind === "playback") {
    return <button onClick={play}>Tap to play</button>;
  }
  return null;
}
```

`AbortError` is never reported. It fires whenever a `pause()` or a `src` change
overtakes a pending `play()` — a double-click, or a held key — and the user's
intent was honoured, so there is nothing to tell them.

A media error wins when both are set. A playback error clears when a `play()`
finally succeeds, and deliberately survives a `src` change: an autoplay block
outlives the track that revealed it.

### `useIsSeekable()`

Whether a position on the track can be named — the duration is known and
non-zero. It is what disables the timeline and the seek buttons, and **loading is
not.**

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

Two things this catches that a load-state check does not:

- **A live stream.** `duration` is `Infinity` while `readyState` is perfectly
  healthy, so there is no end to seek towards. `playerState` says `"playing"`.
- **Nothing else.** Volume, mute, playback rate and `play()` all work before
  metadata arrives, so they are not gated. `play()` in particular: the browser
  queues it at `readyState: 0`, and because changing `audioFile.src` re-enters
  loading, a gate there would suppress the first press on every playlist advance.

The loading state is still announced — on the accessible name, which reads
"Loading audio" — rather than by making the button unavailable.

### `useIsBuffering()`

`isBuffering` on its own, for a spinner that has no reason to subscribe to the
rest of the player.

```jsx
function Spinner() {
  return useIsBuffering() ? <div className="spinner" /> : null;
}
```

It is independent of `playerState`, which stays `"playing"` through a stall: the
player is still in play mode, so your button keeps offering Pause and pressing it
still works. `playerState === "loading"` means the track has not loaded yet;
`isBuffering` means it loaded and then ran out of data.

Seeking into unbuffered audio while paused does not report as buffering.

### `useIsAtEnd()`

Whether the position is the end of the track — for an end-of-track card, a
Replay button, or greying out "next".

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

**A statement about position, not about history.** Dragging to the end reports
`true` with nothing having played, and it clears as soon as the position moves.
Use `onEnded` for the edge — "the track just finished, advance now" — and this
for the level.

Derived from the position rather than tracked, like `useIsBuffering()`: there is
no flag to get stuck on, and nothing to go stale across a `src` change. The test
is `currentTime >= duration` rather than an approximate match, because a browser
parks slightly _past_ the duration when playback ends — Chrome reports about
0.5 s beyond it — so a tolerance-based comparison reads false at exactly the
moment the track finishes.

It stays `false` under `audioProps={{ loop: true }}`. A looping element wraps to
0 rather than resting at the end, and does so without a `timeupdate` ever
reporting the end.

### `useCurrentSecond()` and `useCurrentTime()`

The playback position is not part of `useAudioPlayer()`. It changes about four
times a second, and folding it in would re-render every caller at that rate for a
value most of them are not watching.

```jsx
const second = useCurrentSecond(); // whole seconds — re-renders 1x/sec
const time = useCurrentTime(); // raw position — re-renders ~4x/sec
```

Use `useCurrentSecond` for anything a human reads. Reach for `useCurrentTime`
only for something drawn continuously, such as a waveform or a custom progress
bar.

## Keyboard shortcuts

Available on every focusable control. A slider's own keys take precedence over
the shortcuts below.

On a focused slider the arrow keys adjust its value, and `Home` and `End` jump to
the ends of its range. Those two are slider-only: everywhere else they stay the
browser's.

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

`Space` is not bound, so it keeps activating the focused button. Pass
`customKeyboardShortcuts={{ " ": { type: "TOGGLE_PLAY" } }}` if you want it.

A binding is a `KeyboardAction`, or `null` to unbind — `KeyToActionMap` is
`Record<string, KeyboardAction | null>`. `customKeyboardShortcuts={{ p: null }}`
drops the default play/pause binding and lets `p` reach the browser. It is
player-wide rather than per-control: a key that works on one button and not its
neighbour is a bug report, not a feature.

Two of the player's internal actions are deliberately not bindable: the slider
commit, which carries a value in one component's units and means nothing without
the gesture that produced it, and the end-of-track signal, which would fake a
track ending and advance your playlist.

## Roadmap

- Improve testing
- Initial beta release
- Playlist components, skip and loop (`onEnded` already supports a userland
  playlist)
- Caption and subtitle support
- Multi-language support

## Testing

```bash
# Unit tests (jsdom)
pnpm test

# End-to-end tests (Playwright)
pnpm testE2E
```

## Requirements

- React 18 or later, for `useSyncExternalStore` — CI runs the whole suite
  against React 18 and React 19
- Chrome, Firefox, Safari, Edge
- **ESM only.** There is no CommonJS build, so `require("react-headless-audio-player")`
  fails with `ERR_REQUIRE_ESM` — a message that names Node rather than this
  package. Use `import`, or `await import()` from CommonJS. Node 18 or later.

Times are formatted as `M:SS`, or `H:MM:SS` for content an hour or longer. Live
streams are not supported: an unbounded duration reads as `0`, so gate any UI
that needs a length on `useAudioPlayer().duration > 0`.

## License

MIT
