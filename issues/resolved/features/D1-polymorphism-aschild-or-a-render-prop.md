---
id: D1
title: "Polymorphism for the buttons: `asChild`, or a `render` prop"
epic: features
status: resolved
severity: none
origin: demand
breaking: false
---

The README pitches the library as composed the way Radix is, and the most-used
thing in that API is missing: there is no `asChild`, no `render` prop and no
Slot anywhere in `src/`. Anyone with a design system reaches for it in the first
hour, because `PlayButton` renders a `<button>` they already have a styled
version of.

The field has split on which convention to offer, so this is a choice and not a
lookup: Radix keeps `asChild`, and Base UI went stable in December 2025 with
`render` instead, explicitly to avoid `asChild`'s prop-merging ambiguity around
event handlers and refs. Either is defensible. Deciding after publish is not —
it means shipping both, or breaking the prop type of all ten roots and their
members at once.

The merge semantics are the work, not the prop. Every part here already composes
handlers deliberately (`composeEventHandlers`), and the disabled rule — an
`aria-disabled` control swallows the consumer's own `onClick` — has to survive
being merged onto someone else's element.

## Decisions taken (2026-09-15)

Settled while planning, so they are not re-litigated during implementation. The plan
is `plans/PLAN-button-handlers-and-props-hooks.md`.

**Neither convention is adopted. Props hooks are the answer instead.** `asChild` is
refused outright: Radix's merge rule is child-props-win, which inverts every lock this
library spreads last, and `const Comp = asChild ? Slot : "button"` names `Slot`
unconditionally, so a `PlayButton`-only import pays for the merge implementation — a
smaller replay of **P1-a**. `render` is deferred, not refused: once the props bag is
public it is three lines on top of it and purely additive, so build it if
wrapper-component fatigue turns out to be real.

That also corrects this ticket's premise. "Deciding after publish is not [defensible]"
is true of `asChild` only. Hooks first makes `render` additive forever, so the decision
does not have to be made before the beta.

**Six hooks, one phase — buttons only.** `usePlayButtonProps`,
`useMuteButtonProps`, `useSeekButtonProps(amount, …)`, `useTimeToggleProps`,
`usePlaybackRateSetProps(rate, …)`, `usePlaybackRateChangeProps(amount, …)`. Names
flatten the public component name, so the hook is guessable from the JSX.

**The two slider hooks are refused (2026-09-15).** They were planned as a third phase —
`useSliderControlProps` and `useSliderThumbProps` — and dropped on three grounds.

_This ticket's own sentence does not extend to them._ "`PlayButton` renders a `<button>`
they already have a styled version of" is the entire case for a props hook, and it is
true of a button. A team with a design system has a button. None has an audio scrubber or
a vertical volume slider, so there is no existing element for the bag to be spread onto.

_The main use is the one that breaks._ `useSliderControlProps` must return `ref` —
`setSliderRef` measures the track, and an unmeasured track is `sliderLength: 0`, which
renders normally and ignores every click. On React 18, spreading a `ref` onto a function
component warns and drops it, so `<MyStyledButton {...useSliderControlProps()} />` — the
reason to want the hook at all — yields a silently dead slider. The case that does work,
a plain `<button>`, is already served by `.Control`, which takes `children`, `className`,
`style` and composes handlers.

_It could not be standalone._ The hook reads `SliderContext`, which only `<Timeline>`,
`<Volume>` and `<PlaybackRateSlider>` publish, so the consumer still renders the
library's root. Strictly less than the button hooks, which work anywhere under
`<AudioPlayer>`.

**C5** confirms it: its fix moves the node out of a ref into `useState`, so
`setSliderRef` — the exact value the bag would have exposed — is about to change shape.

What consumers have actually asked for on the slider is **S9**, severity P1: drag state
is reachable from neither CSS nor JS, with no workaround. A props hook does not give them
that; `data-state="dragging"` does. The freed phase became the **S9** attribute pass.

**`<button>` hosts only.** The bag is spread onto a `<button>`, or onto a component
that renders one. It carries `type="button"` (a real, wrong attribute on `<a>`), no
`role` and no `tabIndex`, and `handleMediaKeys` omits `Space` because a real button
already activates on it. Supporting any element means owning keyboard activation,
which is a headless-button primitive rather than a props hook. This satisfies the
ticket as written — "a `<button>` they already have a styled version of" — and not
more. Record it in **D9** alongside the `asChild` refusal.

**Display parts stay out.** `Progress`, `Background`, the `<time>` readouts,
`ErrorMessage`, `RateDisplay`. `useAudioPlayer()` plus `formatTime` already reaches
them; `Progress`'s transform maths is the one genuine candidate and belongs to **D5**.

## Resolution

**Shipped** — Six button props hooks, and neither polymorphism convention.

`usePlayButtonProps`, `useMuteButtonProps`, `useSeekButtonProps(amount, …)`,
`useTimeToggleProps`, `usePlaybackRateSetProps(rate, …)` and
`usePlaybackRateChangeProps(amount, …)`, each exported individually from `src/index.ts`
rather than through a barrel, for the reason **P1-a** measured. Every one of the six
components is now a one-liner over its hook, so the two cannot drift: what
`<PlayButton>` renders is what the hook returns, `data-part` and `data-state` included.

The bag takes the consumer's props as an argument instead of leaving them to be spread
around it. That is what **S24** had to land first for: while `onClick` replaced, a hook
had no honest option — `<Button {...props} onClick={mine} />` breaks playback and
`<Button onClick={mine} {...props} />` never fires theirs. Composed, the hook hands back
one already-composed, already-gated handler and the footgun does not exist to document.

**`asChild` is refused** and **`render` is deferred**; the slider hooks that were this
ticket's Phase 3 are refused too, and that phase became the **S9** attribute pass. All
four decisions and their reasons are recorded in **D9** for the README's
"deliberately not included" section.

**Verified by** — 13 tests in `buttonPropsHooks.test.tsx` — every hook reachable with no
arguments, every part name, and `data-state` on the three that carry one — over the 28
that cover the composition itself under **S24**

**Bundle** — a `PlayButton`-only import is 1,246 B gzipped, against the 1,137 B **P1-a**
left behind. The hooks themselves are free: the code moved rather than grew. The
difference is `composeEventHandlers` entering a button's graph for the first time (S24),
and ~10 B of `data-*` strings (S9). A `usePlayButtonProps`-only import is 1,157 B, which
is the component's own markup less the hook.

**Premise corrected.** "Deciding after publish is not [defensible] — it means shipping
both, or breaking the prop type of all ten roots" is true of `asChild` only. Hooks first
makes `render` additive forever, so the decision does not have to precede the beta. The
deadline this ticket felt belonged to **S24**, which was breaking; both shipped in one
release before it.
