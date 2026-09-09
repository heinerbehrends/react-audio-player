---
id: F6
title: "Media Session API entirely absent"
epic: features
status: open
severity: P1
origin: review
breaking: false
evidence: [verified]
---

0 hits for `mediaSession`. For an _audio_
library this is the most visible platform integration there is — lock screen, OS media keys,
car head units. `SideEffectAction` already maps almost 1:1 onto `setActionHandler`. Blocked
by F3 (no metadata fields to publish).

## Where it stands

Media Session API. The metadata fields on `AudioFile` were added ahead of this so it is not a breaking change when it lands.
