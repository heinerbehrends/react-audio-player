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

**Shipped** — `ErrorMessage`, the three `Time` parts and the `PlaybackRate` root now take the standard DOM props. `ErrorMessage`'s hardcoded `class="audio-player-error"` is gone — checked against `styles.css`, nothing ever matched it, so it was a name in the consumer's markup that they did not choose and that did nothing. `role`/`aria-live` on the alert and `role` on the group stay locked after the spread; the group's `aria-label` stays overridable, being the only way to localise it. A `format` prop is deliberately **not** part of this — see **A15**

**Verified by** —
