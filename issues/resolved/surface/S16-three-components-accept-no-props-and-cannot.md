---
id: S16
title: "Three components accept no props and cannot be styled"
epic: surface
status: resolved
severity: P2
origin: review
breaking: true
evidence: [code-reading]
---

`ErrorMessage`
(children only, and hardcodes `className="audio-player-error"` — an undocumented global
class in a headless library); `Time.Elapsed/.Remaining/.Duration`; the `PlaybackRate` root.
Formatting is locked to `M:SS` with no `format` prop.

## Resolution

**Shipped** — `ErrorMessage`, the three `Time` parts and the `PlaybackRate` root now take the standard DOM props. `ErrorMessage`'s hardcoded `class="audio-player-error"` is gone — checked against `styles.css`, nothing ever matched it, so it was a name in the consumer's markup that they did not choose and that did nothing. `role`/`aria-live` on the alert and `role` on the group stay locked after the spread; the group's `aria-label` stays overridable per instance. A `format` prop is deliberately **not** part of this — see **A15**, where it landed as the `labels.time` entry rather than a per-readout prop: it names all three readouts at once and leaves `Intl` to the consumer, receiving a **magnitude** rather than a signed number, so a `"remaining"` entry writes its own `-`

**Amended 2026-09-16, after A15 shipped.** Two corrections to the paragraph above, and one defect it introduced.

The group's `aria-label` was described here as "the only way to localise it". That was true when written and is no longer: **A15** shipped `labels.rateGroup`, so the per-instance `aria-label` is now the override rather than the mechanism. The same holds for every other name this ticket touched.

**`labels.time` is keyed by `part`, not per instance**, which is a real limit rather than a technicality. Two `Time.Duration` in one player cannot be formatted differently, and formatting one readout means supplying an entry that handles all three. `useTimeDisplay()` and `formatTime` are now exported for exactly that case — render your own `<time>` without re-deriving `remaining`, its clamp, or the default clock.

**The `Time` parts accepted `children` and discarded it.** `TimeHTMLAttributes` carries `children`, nothing destructured it, and JSX children are `createElement`'s third argument — so the readout's own text always won. `<Time.Duration>{mine}</Time.Duration>` type-checked, rendered the library's clock, and warned about nothing; paired with `dangerouslySetInnerHTML` it threw at runtime. This arrived with the props bag _this_ ticket shipped — A15 neither caused it nor made it worse. `TimeProps` now omits both keys, so each is a compile error pointing at `labels.time`, pinned by a `@ts-expect-error` pair in `Time.test.tsx` that fails the type-check if the `Omit` is removed. Type-level breaking, and deliberately so: the code it breaks was already not doing what it said

**Verified by** — `ErrorMessage.test.tsx` (empty `className`, pass-through, and `role`/`aria-live` surviving a consumer's own values), `Time.test.tsx` (props through on all three parts, and the children rejection above), `PlaybackRate.test.tsx` (props and a replaceable `aria-label` with `role` locked)
