---
id: S28
title: "A stylesheet cannot restyle the progress fill"
epic: surface
status: resolved
severity: P2
origin: backlog
breaking: true
evidence: [verified]
---

The README's custom-properties example (S20) sets `transform: none` and
`width: calc(var(--progress) * 100%)` on `[data-part="progress"]` from a
stylesheet. It did nothing: every `.Progress` carried an inline `width: 100%`
and `transform: scaleX(p)`, and an inline declaration beats any rule. The only
way through was the `style` prop or `!important`, though the README presented
the stylesheet rule as the way to use the property.

The fill's default could not simply move to `styles.css`: the README promises
a working slider with no stylesheet imported, and an unimported fill draws
nothing.

## Resolution

**Shipped** (2026-10-05). All three sliders render one shared
`SliderProgress`. Its size and transform come from `progressFillRules`, a
rule rendered in a `<style>` beside the fill: `width` and `height` at `100%`
and `scaleX(var(--progress, 0))`, or `scaleY()` from the bottom on a vertical
slider. Every selector is wrapped in `:where()`, so its specificity is zero and
any consumer rule wins regardless of load order. The orientation is matched on
the fill, which now carries `data-orientation`, rather than on an ancestor that
could belong to another component.

React 19 hoists the `<style>` into `<head>` once, keyed by `href`; React 18
renders it in place, once per fill. Both emit it in server markup, so the fill
draws before hydration. Only grid placement, `z-index` and Timeline's
`transition` stay inline; the transition is still dropped during a drag and
still yields to `style`.

Breaking for code that read the fill's inline `transform`, and for stylesheet
rules on the fill that were silently ignored until now. A CSP that blocks
`<style>` elements (`style-src-elem` without `'unsafe-inline'`) loses the
default fill.

**Verified by** — `the fill` in `testJSDom/Slider/calculateStyle.test.ts`
(nothing sized inline, both rules present, every selector in `:where()`,
vertical after horizontal), `leaves the fill's size and transform to a rule it
ships` in `testJSDom/Timeline/Timeline.test.tsx`, `marks a vertical fill for
the vertical rule` in `testJSDom/Volume/Volume.test.tsx`, and the existing
transition tests. jsdom resolves neither `:where()` nor `var()` in computed
style; `progress-indicator.spec.ts` reads the computed transform in a browser.
