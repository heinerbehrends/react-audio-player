---
id: A9
title: "`aria-current` is the wrong property for rate options"
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: true
evidence: [code-reading]
---

`SetPlaybackRate.tsx:27`. `aria-current` means "current item in a set of _navigational_
items". Mutually exclusive settings want a radio group or `aria-pressed`.

## Resolution

**Shipped** — `aria-pressed` in place of `aria-current` on `PlaybackRate.Set`. Chosen over a radio group, which ARIA suggests for a one-of-several setting but which expects arrow keys to move between the options — and arrows already seek and change the volume on every focused control, so a radiogroup would have made the keyboard model differ per control. Reconciled with A4 by stating the rule as "one state channel", not "no `aria-pressed`": the three toggles put state in their name, and this button's name is fixed. Written as `"false"` on the inactive rates rather than omitted, so the row announces as a set — **mutation-proven**: making it absent-when-false fails 2 rows

**Verified by** —
