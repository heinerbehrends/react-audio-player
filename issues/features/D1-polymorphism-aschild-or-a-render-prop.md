---
id: D1
title: "Polymorphism: `asChild`, or a `render` prop"
epic: features
status: open
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

**Eight hooks, in two phases.** Six buttons — `usePlayButtonProps`,
`useMuteButtonProps`, `useSeekButtonProps(amount, …)`, `useTimeToggleProps`,
`usePlaybackRateSetProps(rate, …)`, `usePlaybackRateChangeProps(amount, …)` — then
`useSliderControlProps` and `useSliderThumbProps`. Names flatten the public component
name, so the hook is guessable from the JSX.

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
