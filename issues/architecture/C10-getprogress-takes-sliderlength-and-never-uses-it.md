---
id: C10
title: "`getProgress` takes `sliderLength` and never uses it arithmetically"
epic: architecture
status: open
severity: P3
origin: review
breaking: false
evidence: [code-reading]
---

`calculateStyle.ts:52-66` — it's a proxy for "not measured yet". Reasonable, but the
signature promises a pixel computation and returns a fraction.

## Where it stands

`getProgress` takes `sliderLength` and never uses it arithmetically — it is a proxy for "not measured yet". Reasonable behaviour, misleading signature.
