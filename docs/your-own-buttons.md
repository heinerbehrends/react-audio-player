# Your own buttons

When you already have a styled `<button>`, such as a design system's `Button`,
put the library's behaviour on it with a props hook rather than rendering the
library's markup. Each of the six buttons is a one-liner over its hook, so the
hook gives you exactly what the component renders:

```jsx
import { usePlayButtonProps } from "react-headless-audio-player";

function PlayPause() {
  return <MyButton {...usePlayButtonProps()}>▶</MyButton>;
}
```

| Hook                         | Component               | Leading argument |
| ---------------------------- | ----------------------- | ---------------- |
| `usePlayButtonProps`         | `<PlayButton>`          | —                |
| `useMuteButtonProps`         | `<MuteButton>`          | —                |
| `useSeekButtonProps`         | `<SeekButton>`          | `amount`         |
| `useTimeToggleProps`         | `<Time.Toggle>`         | `defaultValue`   |
| `usePlaybackRateSetProps`    | `<PlaybackRate.Set>`    | `rate`           |
| `usePlaybackRateChangeProps` | `<PlaybackRate.Change>` | `amount`         |

Each returns the accessible name, `type`, `data-part`, the click handler, the
keyboard handler and the `aria-disabled` gate, plus `data-state` on the three
that have one and `aria-pressed` on `.Set`.

`usePlayerRootProps()` does the same for [`<PlayerRoot>`](accessibility.md#naming-the-player),
onto a container of your own.

## Pass your props in

```jsx
<MyButton {...usePlayButtonProps({ onClick: track, className: "btn" })} />
```

The result composes them: your handlers run first and the library's second,
and `preventDefault()` in yours opts out of the library's. An `onClick` added
after the spread replaces the library's instead, which silently breaks
playback.

`amount`, `rate` and `defaultValue` are leading arguments rather than keys of
the props object, so they never reach the DOM as unknown attributes.

## Spread the result last

The gate, the handlers and `type` are the library's and cannot be overridden.
The name, `data-part` and `data-state` sit in front of your props, so you can
replace those. Spread the result first and your own props can spread the gate
away, which defeats the [accessibility guarantees](accessibility.md).

Spread it onto a `<button>`. The result carries `type="button"` and no `role`
or `tabIndex`, and relies on the button's own `Enter` and `Space` activation.

## A time toggle of your own

`useTimeToggleProps(defaultValue)` gives you `<Time.Toggle>`'s props. Render
`<Time.Elapsed />` or `<Time.Remaining />` inside your button from the
result's `data-state`, and pass no `data-state` of your own: it would replace
the one that says which readout is showing.

## No slider hooks

There are no slider hooks. No design system has an audio scrubber, so there is
no existing element to spread onto, and the result would have to carry a `ref`,
which React 18 drops when it is spread onto a function component, leaving a
track that renders and ignores every click. Use `<Timeline>`, `<Volume>` and
`<PlaybackRateSlider>`, whose `.Control` takes `children`, `className` and
`style` and composes handlers the same way.

## No `asChild`

There is no `asChild` either. Radix's rule is that the child's props win, which
would undo every attribute this library spreads last: `role="slider"`,
`tabIndex={-1}`, `aria-hidden` and the `aria-disabled` click gate. The props
hooks cover the same ground.
