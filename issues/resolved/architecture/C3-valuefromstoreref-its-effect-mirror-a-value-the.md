---
id: C3
title: "`valueFromStoreRef` + its effect mirror a value the store gives free"
epic: architecture
status: resolved
severity: P1
origin: review
breaking: false
evidence: [verified]
---

`useSlider.ts:130-133` is the textbook "mirror rendered state into a ref via an effect"
smell, and here it's strictly _staler_ than the alternative: `commit` runs from a window
`pointerup` listener that can land before React flushes passive effects. Atoms expose
`get()`. Deletes a ref, an effect, and a staleness window at zero cost.

## Where it stands

`valueFromStoreRef` + its effect mirror a value `atom.get()` returns directly, and more freshly.

## Resolution

**Shipped** — `valueFromStoreRef` and its effect are gone. `commit` reads `valueAtom.get()`, which is always current, so the retain-until-the-store-moves comparison is made against the value the element really held.

**Verified by** — a new row that emits `timeupdate` deliberately outside `act`, which is the window the mirror was stale in, and then commits. The committed value holds. Mutation-proven: committing against the rendered value instead snaps the display back to the echo.
