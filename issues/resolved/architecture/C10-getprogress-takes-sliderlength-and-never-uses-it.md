---
id: C10
title: "`getProgress` takes `sliderLength` and never uses it arithmetically"
epic: architecture
status: resolved
severity: P3
origin: review
breaking: false
evidence: [code-reading]
---

`calculateStyle.ts:52-66` — it's a proxy for "not measured yet". Reasonable, but the
signature promises a pixel computation and returns a fraction.

## Where it stands

`getProgress` takes `sliderLength` and never uses it arithmetically — it is a proxy for "not measured yet". Reasonable behaviour, misleading signature.

## Resolution

**Shipped** — `getProgress` takes the value and its range, and nothing else. "Has the track been measured yet" is now its own line in `calculateProgressStyle`, where it reads as the question it is. Same output, honest signature.

**Verified by** — 2 rows: no fill before the track is measured, and the same fraction at every length once it is. Mutation-proven: dropping the guard draws a fill at zero length.
