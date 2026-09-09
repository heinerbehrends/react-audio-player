---
id: A13
title: "Float noise in `aria-valuenow`"
epic: accessibility
status: open
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
