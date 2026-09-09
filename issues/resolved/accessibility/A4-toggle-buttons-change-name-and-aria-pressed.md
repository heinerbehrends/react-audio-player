---
id: A4
title: "Toggle buttons change name _and_ `aria-pressed`"
epic: accessibility
status: resolved
severity: P1
origin: review
breaking: true
evidence: [measured]
---

`MuteButton.tsx:20-21`, `PlayButton.tsx:9-14,26-27`. After clicking Mute:
`aria-label="Unmute" aria-pressed="true"` → announced as "Unmute, toggle button, pressed",
which is self-contradictory. _WCAG 4.1.2 (A)._ `Time.Toggle` (`TimeDisplay.tsx:25-26`) does
it correctly — stable name, state on `aria-pressed`. Pick one channel.

## Resolution

**Shipped** — One state channel on all three toggles: the name. `aria-pressed` removed from `PlayButton`, `MuteButton` and `Time.Toggle`, which gained a flipping name ("Show time elapsed" / "Show time remaining"). Verified by 3 rows asserting the attribute's absence — a re-added `aria-pressed` now fails

**Verified by** —
