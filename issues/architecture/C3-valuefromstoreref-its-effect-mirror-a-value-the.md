---
id: C3
title: "`valueFromStoreRef` + its effect mirror a value the store gives free"
epic: architecture
status: open
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
