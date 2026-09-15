---
id: A13
title: "Float noise in `aria-valuenow`"
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: false
evidence: [measured]
---

`sliderModes.ts:55,66` use identity quantizers:
`aria-valuenow="0.8999999999999999"`, `"1.2000000000000002"`. Shielded by `aria-valuetext`
today, so low impact — but rounding costs nothing and `seek` already does it.

## Where it stands

Float noise in `aria-valuenow`: the volume and rate modes use identity quantizers, so the value announces as `0.8999999999999999`. Shielded by `aria-valuetext` today, which is why it is not urgent — but rounding costs nothing and `seek` already does it.

## Resolution

**Shipped** — Both identity quantizers replaced with one that rounds to hundredths, so `aria-valuenow` is `0.9` where it announced `0.8999999999999999`. Two decimals is 1 % of the volume range and the precision `"1.25x"` already shows, so the smallest arrow step in either mode still moves the announced number — the thing rounding could have broken. The rate's `aria-valuetext` no longer rounds separately: it is handed the rounded value, so the two cannot disagree. `value` itself is untouched, since the thumb is drawn from it.

**Verified by** — 4 rows in `useSlider.test.tsx` ("the announced value is rounded"). Mutation-proven: putting the identity quantizer back fails them.
