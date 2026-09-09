---
id: A7
title: "Focus is destroyed on load-state change"
epic: accessibility
status: resolved
severity: P1
origin: review
breaking: true
evidence: [measured]
also: [A5]
---

Native `disabled` removes the focused element from the tab order, dropping focus to
`<body>`. Observed on a mid-session `src` swap. _WCAG 2.4.3 (A)._ Fixed by the same
`aria-disabled` change as A5.

## Resolution

**Shipped** — `aria-disabled` in place of native `disabled`, on the six gated buttons and all three sliders. `useDisabledButtonProps` blocks activation, the consumer's `onClick` included. Verified by a jsdom test that focuses a control, drops the load state under it, and finds focus still there. **Later refined** — the mechanism is unchanged, but the predicate it read was wrong; see "Two gates, not one" below

**Verified by** —
