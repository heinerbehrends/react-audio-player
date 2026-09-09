---
id: B4
title: "Firefox **does** diverge on `ended`, measured on a bare element with no pointer simulation"
epic: features
status: open
severity: none
origin: backlog
breaking: false
---

a paused seek to `duration` sets `el.ended` and fires the event, where Chrome does neither. So a drag to the end of the timeline calls a consumer's `onEnded` — advancing their playlist — in Firefox only. `useIsAtEnd` is unaffected, being derived from position, which both browsers agree on. **Still undecided**: whether to paper over the divergence or document it. Now testable on both engines, so whichever is chosen can be pinned.
