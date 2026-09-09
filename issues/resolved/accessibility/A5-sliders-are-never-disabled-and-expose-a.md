---
id: A5
title: "Sliders are never disabled and expose a degenerate range"
epic: accessibility
status: resolved
severity: P1
origin: review
breaking: true
evidence: [measured]
also: [A7]
---

`SetSliderValue` has no disabled path. In the error state:
`aria-valuenow="0" aria-valuemin="0" aria-valuemax="0"`, no `disabled`, no `aria-disabled`.
Arrow keys are accepted and do nothing, silently. Use `aria-disabled="true"` so the tab stop
survives (this also fixes A7).

## Resolution

**Shipped** — `aria-disabled` in place of native `disabled`, on the six gated buttons and all three sliders. `useDisabledButtonProps` blocks activation, the consumer's `onClick` included. Verified by a jsdom test that focuses a control, drops the load state under it, and finds focus still there. **Later refined** — the mechanism is unchanged, but the predicate it read was wrong; see "Two gates, not one" below

**Verified by** —
