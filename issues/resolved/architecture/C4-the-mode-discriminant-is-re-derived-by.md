---
id: C4
title: "The mode discriminant is re-derived by hand six times"
epic: architecture
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`useSlider.ts:96-116`, immediately above the `config` resolved for the purpose. Two live
consequences: `store.duration` is subscribed **unconditionally**, so every volume and rate
slider re-renders on `durationchange` for a value it never uses; and the `mode === "seek"`
branch silently discards a caller's `maxValue`, which `UseSliderOptions` advertises for all
modes.

## Where it stands

The mode discriminant is re-derived six times; `useSlider` subscribes to the same atom twice in volume/rate mode.

## Resolution

**Shipped** — The mode is resolved once, into `isSeek` and a `valueAtom`. Both live consequences are gone with it:

- **The duplicate subscription.** Only `"seek"` announces something other than its own value, so only `"seek"` subscribes to a second atom. This is also the free win **P1-b** measured at 12.5 % of the volume drag's notification traffic.
- **The duration.** `useStore(isSeek ? store.duration : NEVER)` — a `constant(0)` atom that never notifies, since a hook call cannot be dropped but the atom behind it can. `useIsSeekable()` is inlined as `duration > 0` for the same reason: through the hook, the seek slider held two duration subscriptions and every volume and rate slider held one it never read.
- **`maxValue`.** Honoured in every mode. In `"seek"` the duration is now the default rather than the rule, so the option `UseSliderOptions` advertises is no longer dropped on the floor. `<Timeline>` passes none, so nothing about it changed.

**Verified by** — 5 rows, including a render counter that pins a volume and a rate slider not re-rendering on `durationchange` while the seek slider still does. Mutation-proven in all three parts.
