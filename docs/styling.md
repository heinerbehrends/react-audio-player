# Styling

The library renders no visual styling of its own. Every part takes
`className`, `style` and a `ref`, and carries a `data-part` attribute, so you
can style from plain CSS without threading a class through every element.

## Selectors

| Part                     | `data-part`    |
| ------------------------ | -------------- |
| `<PlayerRoot>`           | `player`       |
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
| `<TimelineBuffered>`     | `buffered`     |
| `.Thumb`                 | `thumb`        |

All three sliders share these part names, so each root also says which slider
it is: `data-slider="timeline"`, `"volume"` or `"rate"`.

```css
[data-slider="volume"] [data-part="progress"] {
  background: rebeccapurple;
}
```

Select on `data-part`, not on `aria-label`. The label is translatable, so
`button[aria-label="Play audio"]` breaks the day you ship in German; a part name
does not move.

## State attributes

An attribute exists only where the element does not already carry the
information, so some states are spelled in ARIA:

| State                         | Read it from                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| play/pause/loading/error      | `[data-part="play"][data-state="playing"]`                          |
| muted/low/high volume         | `[data-part="mute"][data-state="muted"]`                            |
| which time readout is showing | `[data-part="time-toggle"][data-state="elapsed"]`                   |
| a slider being dragged        | `[data-part="root"][data-state="dragging"]`                         |
| a slider's axis               | `[data-part="root"][data-orientation="vertical"]`                   |
| **unavailable**               | `[aria-disabled="true"]` — not `data-disabled`, and not `:disabled` |
| **the rate in effect**        | `[aria-pressed="true"]` on `.Set` — not `data-state`                |

There is no `data-disabled`: every button and `.Control` already renders
`aria-disabled`. A slider root has no disabled signal of its own;
`[data-part="root"]:has([aria-disabled="true"])` reaches it from the control
inside.

The drag state is on the slider root, so one attribute reaches every part:

```css
[data-part="root"][data-state="dragging"] [data-part="thumb"] {
  transform: scale(1.2);
}
```

`data-orientation` is on the root because `aria-orientation` sits on
`.Control`, a child, where a root-level layout rule cannot see it.

The state values are API, so they are named in the props hooks' return types
as well.

## The optional stylesheet

`.Control` is a `<button>`, so without a reset it renders with the browser's
button chrome. The library ships that reset as a stylesheet rather than inline,
because an inline style outranks every rule you could write:

```js
import "react-headless-audio-player/styles.css";
```

It sets three things: `width: 100%` on the slider root, the button reset on
`.Control`, and `cursor: grab` on `.Thumb`. Every rule is one selector deep, so
a single class of your own overrides it as long as your CSS loads afterwards.
Skip the import and the library styles nothing beyond the inline output below.

## What stays inline

The thumb's `transform`, grid placement, `position`, `touch-action` and
`z-index` are computed from the current value, so they are inline. Override
them through the `style` prop, which is merged last.

The progress fill's size and transform — `width: 100%`, `height: 100%` and
`scaleX(var(--progress))`, or `scaleY()` from the bottom on a vertical slider —
come from a `<style>` the library renders beside the fill, so they need no
import. Its selectors are wrapped in `:where()`, so any rule of yours on
`[data-part="progress"]` replaces them, wherever it loads.

**A slider root needs a height.** It has none of its own, and a zero-height
track measures zero, which leaves the slider silently inert.

A slider root is `display: grid` inline, because that is how its layers stack.
The `hidden` attribute still hides it. To hide one from CSS, in a media or
container query, use `display: none !important`, or hide an element wrapped
around it.

The layers stack in one order whatever order you write them in: `.Background`
at `z-index: 0`, `<TimelineBuffered>` at `1`, `.Progress` at `2`, `.Thumb` at
`3`. Overriding the fill's `transform` does not put the background on top.

## Animating the fill

Nothing animates. The position arrives in `timeupdate` steps, about four a
second, and the fill and the thumb jump to each one, and straight to the target
of a seek. To smooth playback, add a transition and drop it during a drag. A
seek will glide too, and the thumb, which is positioned inline, still steps:

```css
.player [data-slider="timeline"] [data-part="progress"] {
  transition: transform 250ms linear;
}
.player [data-slider="timeline"][data-state="dragging"] [data-part="progress"] {
  transition: none;
}
```

## Custom properties

Every slider root carries the two numbers behind the fill and the thumb, which
every part inherits:

| Property     | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| `--progress` | The filled fraction, unitless `0`–`1`                         |
| `--offset`   | The thumb's position along the track, in `px`, from the start |

Reach for `--progress` when a transform cannot draw what you want. `scaleX()`
squashes a `border-radius` along with the fill; a width does not:

```css
.player [data-part="progress"] {
  transform: none;
  width: calc(var(--progress) * 100%);
  border-radius: 999px;
}
```

A waveform is cut at the playhead rather than squashed:

```css
.waveform-played {
  transform: none;
  clip-path: inset(0 calc((1 - var(--progress)) * 100%) 0 0);
}
```

A gradient that stays put while the fill grows, or a conic dial, reads the
fraction the same way:

```css
.player [data-part="thumb"] {
  background: conic-gradient(
    rebeccapurple calc(var(--progress) * 360deg),
    transparent 0
  );
}
```

`--offset` runs the way the thumb's transform does: from the left, or from the
top of a vertical slider, and reads `0px` until the track has been measured.
Both stay on the track when the value leaves the range: a rate set past the
slider's maximum reads `--progress: 1`.

`<TimelineBuffered>` sets its own `--buffered`, `0`–`1`.

The [waveform example](../examples/waveform) draws a played and an unplayed
waveform from `--progress`.

## Refs

The `ref` on every part reaches its own element: focus the play button after a
track change, or anchor a tooltip to `.Control`.
