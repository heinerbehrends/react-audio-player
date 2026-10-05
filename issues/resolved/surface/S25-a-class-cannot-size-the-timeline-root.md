---
id: S25
title: "A class cannot size the `<Timeline>` root"
epic: surface
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's minimal example (D8). `.minimal-slider { height: 24px }`
sized `<Volume>` and left `<Timeline>` at **0 px tall**: the timeline root
spreads `containerStyles` (`src/Timeline/Timeline.tsx:81`), which is
`rootStyles` plus an inline `height: 100%`, and an inline declaration beats any
class. `<Volume>` and `<PlaybackRateSlider>` spread `rootStyles` alone, so a
class sizes them. In a flex row with no definite height, `100%` resolves to 0,
and the slider is the silently inert one the README warns about.

It contradicts the README twice: "A slider root needs a height. It has none of
its own", and the S8 split, which moved `width/height: 100%` out of inline
styles as opinion. The `height` on the root survived that move; the one on
`.Control` is structural (it fills the root) and stays.

**Fix:** spread `rootStyles` on the timeline root, as the other two roots do.
A consumer who sized the timeline by its parent's height gets 0 instead, so
the README's height paragraph and the example in `Timeline`'s JSDoc both need
a height on the root. Pre-1.0 and unpublished, so not a migration. Then the
minimal example's `style={{ height: 24 }}` moves into its stylesheet.

## Resolution

**Shipped** (2026-10-05). The timeline root spreads `rootStyles`, as the volume
and rate roots do; `containerStyles` stays on `.Control`, which fills the root.
The jsdom test that pinned the inline `height: 100%` now pins its absence, next
to the S8 assertion for `width`. The basic example sizes its timeline from
its stylesheet alone.

**Verified by** — the jsdom suite (701 tests), and the Timeline E2E specs,
`seek-click.spec.ts` and the demo smoke test in Chromium: the dev app sizes its
timeline through `style`, so nothing there depended on the inline height.
