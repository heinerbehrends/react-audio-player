---
id: S30
title: "`Time.Toggle`'s readout follows a `data-state` the caller can replace"
epic: surface
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [verified]
---

`Time.Toggle` picked its readout with `toggle["data-state"] === "elapsed"`, but
`data-state` sits in the bag's defaults tier, which the caller's props replace —
on purpose, for the hooks (S9). So `<Time.Toggle data-state="on" />`
type-checked and then always showed `Time.Remaining`, while each click still
flipped the internal state and the accessible name: the name and the visible
readout drifted apart.

The README's recipe for a button of your own, "render the readout from its
`data-state`", steered consumers into the same trap.

## Resolution

**Shipped** (2026-10-05). An internal `useTimeToggle` returns the state
alongside the bag; `Time.Toggle` branches on the state, and `useTimeToggleProps`
returns the bag alone, its signature unchanged. `data-state` stays overridable.
The hook's JSDoc and the README's `Time.Toggle` passage say not to pass a
`data-state` of your own when rendering the readout from it.

**Verified by** — `Time.test.tsx`: under `data-state="on"` the toggle starts on
elapsed and switches to remaining on click, in step with its accessible name.
`buttonPropsHooks.test.tsx`: `useTimeToggleProps("remaining")` starts on
`data-state="remaining"` named "Show time elapsed".
