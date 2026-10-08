# Accessibility

What the components give you, and the few things that are yours to do.

## What is yours to do

- **Name the player.** Wrap your controls in `<PlayerRoot>`, or spread
  `usePlayerRootProps()` onto a container of your own. See
  [Naming the player](#naming-the-player).
- **Style unavailable controls from `[aria-disabled="true"]`**, never
  `:disabled`. See [Unavailable controls](#unavailable-controls).
- **Spread a props hook's result last, onto a `<button>`.** See
  [Your own buttons](your-own-buttons.md).
- **Translate the names** through [`labels`](localisation.md) if you ship in
  more than English.

## Sliders

Each slider exposes one focusable `role="slider"` element, `.Control`, that
carries the `aria-value*` attributes and takes the arrow keys, `Home` and
`End`. The drag thumbs are pointer affordances only: they are `aria-hidden` and
out of the tab order, so a slider announces one value rather than two.

A slider root is a plain `<div>` with no role: the parts inside it are one
control, already named, so a wrapper role would announce a group of one.
`<PlaybackRate>` is the exception and keeps `role="group"`, because it wraps
several buttons. If you compose other controls into a slider root, add your own
`role="group"` and `aria-label`; props are spread through.

The volume slider announces the mute as well as the volume, "Muted, 80%",
since the arrow keys change the volume without unmuting.

## Naming the player

`<AudioPlayer>` renders no element, so nothing names or bounds the player as a
whole: two players on a page announce identically. Wrap your controls in
`<PlayerRoot>` and each player becomes a named landmark:

```jsx
<AudioPlayer track={track}>
  <PlayerRoot className="player">
    <PlayButton>…</PlayButton>
    <Timeline>…</Timeline>
  </PlayerRoot>
</AudioPlayer>
```

It renders a `<div data-part="player" role="region">` named by
`track.title`, or by `labels.player` without one; `aria-label` or
`aria-labelledby` override both. It also carries `tabIndex={-1}` and the
[keyboard shortcuts](keyboard.md): a click on the cover or the title focuses the
player, so the shortcuts keep working, without adding a tab stop or a focus
ring.

For a container of your own, such as a `<section>` or one another component
library renders, spread `usePlayerRootProps()` onto it instead. Both are
opt-in: `<AudioPlayer>` will not render a wrapper itself, since one would break
every layout composed around it.

## Where each control says its state

Each control says its state in exactly one place.

For the three toggles it is the **name**, which changes with the state:
`<MuteButton>` is "Mute" or "Unmute", `<PlayButton>` is "Play audio", "Pause
audio", "Loading audio" or "Error loading audio", and `<Time.Toggle>` is "1:23
elapsed, show time remaining". The toggle's name starts with the time on
screen, so a voice-control user can say what they see. None of them sets
`aria-pressed`: a name that says which way the toggle will go, plus a pressed
state, announces as a contradiction ("Unmute, toggle button, pressed").

For `<PlaybackRate.Set>` it is **`aria-pressed`**, because its name does not
move: "Set playback rate to 1.5x" reads the same whether or not that rate is in
effect. The rate in effect is `aria-pressed="true"` and the others are
`"false"` rather than absent, so the row announces as a set of choices.

Every string above is English until you say otherwise. Translate them all with
[`labels`](localisation.md), or one control at a time with your own
`aria-label`.

## Unavailable controls

An unavailable control is marked `aria-disabled` and does nothing when
activated, your own `onClick` included. Style that state from
`[aria-disabled="true"]`, never `:disabled`. The native attribute is not used:
it takes the control out of the tab order, so a `src` swap under a focused
control would drop focus to `<body>`.

**Loading does not make a control unavailable.** `play()`, the volume, the mute
and the rate all work before metadata arrives, and a track change re-enters
loading, so disabling there would swallow the first press on every playlist
advance. Instead:

- an error disables everything;
- an unknown duration, before metadata and on a live stream, disables only the
  timeline and the seek buttons, the two that name a position on the track;
- a browser that ignores `volume` writes, which is iOS, disables only the volume
  slider.

The loading state is still announced, on `<PlayButton>`'s name.

Errors render into a live region through `<ErrorMessage>`.

## Handlers and shortcuts

Your handlers run alongside the library's rather than replacing them: yours
first, the library's second, and `preventDefault()` in yours opts out of the
library's. On a `<button>` that also cancels `Enter` and `Space` activation, so
scope it to the key you are handling; to turn a media shortcut off, unbind it
with `shortcuts` instead.

Every control accepts the [keyboard shortcuts](keyboard.md) while focused,
whether or not it is disabled: the shortcuts belong to the player, not to the
control. A slider's own arrow keys are the exception and stop while it is
disabled.

## Props hooks

These promises hold for the components. The
[props hooks](your-own-buttons.md) hand you the same attributes and let you
decide where they go, so spreading the result before your own props, or onto
something that is not a `<button>`, can defeat the disabled gate or the
semantics. Spread it last, onto a `<button>`, and you get everything above.
