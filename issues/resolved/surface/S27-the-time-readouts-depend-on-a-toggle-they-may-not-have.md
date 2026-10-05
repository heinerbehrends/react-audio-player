---
id: S27
title: "The time readouts depend on a toggle they may not have"
epic: surface
status: resolved
severity: P2
origin: backlog
breaking: true
evidence: [code-reading]
---

Found building the demo's basic example (D8), which wanted to show the time
left by default. Which of `Time.Elapsed` and `Time.Remaining` rendered was a
store atom, `timeDisplay`, that started at `"elapsed"` and only `Time.Toggle`
wrote. So:

- **`<Time.Remaining />` on its own rendered nothing,** permanently: with no
  toggle there was nothing to select it. A player that only shows the time
  left, which is a common design, could not use the part named for it.
- **Nothing could start the display on remaining.** No prop seeded the atom.
- **The store held one piece of UI state** among projections of the element.

Five shapes were weighed: a default on the root, on the toggle, a controlled
pair, a setter in `useAudioPlayer()`, and inferring the default from the order
of the toggle's children. Ordering was rejected as a hidden rule that breaks
under any wrapper element; a root prop puts the default away from the control
that owns the choice.

## Resolution

**Shipped** (2026-10-05). The choice moved out of the store and into the toggle:

- `Time.Elapsed` and `Time.Remaining` always render their own number.
- `Time.Toggle` renders the readout itself — `Time.Elapsed` or
  `Time.Remaining` — and switches on press. It takes no children, so the old
  `<Time.Toggle><Time.Elapsed /><Time.Remaining /></Time.Toggle>` is a compile
  error rather than two readouts. `defaultValue="remaining"` starts it on
  remaining, read once on mount; each toggle keeps its own choice.
- `useTimeToggleProps(defaultValue, props)` holds the same state for a button
  of your own, which renders the readout from `data-state`.
- `timeDisplay` is gone from the store, which now hands out no writable atom.
  `TimeDisplayState` is exported from the time module instead.

The README's time-display, labels and props-hooks sections, the labels JSDoc,
the dev app and the basic example follow. Breaking only for code written against
the unpublished API.

**Verified by** — `Time.test.tsx`: readouts show with no toggle, the toggle
starts on elapsed or on `defaultValue` and swaps on click, reads the default
once, and two toggles stay independent; a type-level case rejects children. The
store test pins that no atom is writable. The jsdom suite (705 tests) and the
time-display E2E spec.
