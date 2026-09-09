---
id: A12
title: "The time display reads as bare numbers"
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: true
evidence: [measured]
---

`TimeDisplay.tsx:57,59,74,80` — `aria-label` **replaces** the accessible name, so AT
announces "elapsed" rather than "0:00", and `role=time` is not surfaced by NVDA/JAWS. No
`Time.*` part accepts props, so a consumer cannot fix it. Mitigated by the timeline's good
`aria-valuetext`.

## Resolution

**Shipped** — The clocks carried `aria-label="elapsed"` / `"remaining"` / `"duration"`, which _replaces_ the accessible name — so a screen reader read "elapsed" and never the time, for every user, in English. Worse in both directions than the finding recorded: `<time>` maps to no ARIA role, and naming a generic element is not reliably announced, so the label was as likely to be dropped as to hide the value. Removed; the text is the name. `data-part` replaces it as the query and styling hook, and a consumer can pass their own label now that props are accepted

**Verified by** —
