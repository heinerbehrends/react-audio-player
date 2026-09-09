---
id: A1
title: "Space activates nothing — it starts playback instead"
epic: accessibility
status: resolved
severity: P0
origin: review
breaking: false
evidence: [measured]
---

`src/KeyboardControls/handleMediaKeys.ts:21` maps `" "` to `TOGGLE_PLAY`, and `:66` calls
`preventDefault()`, suppressing native button activation. The handler is attached to every
control in the library. Observed: focus "Seek forward by 10 seconds", press Space →
`paused: true → false`, no seek. Enter still works (`"Enter"` is unmapped).
_WCAG 2.1.1 Keyboard (A); APG Button pattern._
Fix: skip the map for `" "` when the target is an activatable control, or drop `" "` from
the defaults — `p`/`k` already cover play/pause.

## Resolution

**Shipped** — Space dropped from the default key map, so it activates the focused button again

**Verified by** — Browser: seeks 10 s, no longer starts playback
