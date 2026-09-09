---
id: A11
title: '`role="group"` is inconsistent across the three sliders'
epic: accessibility
status: resolved
severity: P2
origin: review
breaking: true
evidence: [measured]
---

`Timeline.tsx:71` group with **no name**; `Volume.tsx:42-43` group _with_ a name;
`PlaybackRateSlider.tsx:61-70` no role at all. An unnamed group is not useful. Name all
three or drop all three.

## Resolution

**Shipped** — Dropped rather than named, on all three sliders. Each root wraps one control that already carries `role="slider"` and a name, so the group had a single member and Volume's "Volume controls" was a second name for "Volume slider". `PlaybackRateSlider` already shipped without one, which was the control case. Dropping it also unlocks the root: `role` was spread last, so a consumer composing extra controls in could not add their own — now they can. `PlaybackRate` keeps its group, wrapping several buttons, which is the contrast that shows the rule rather than a blanket removal. Grouping the player as a whole is a different question and stays open as **A10**

**Verified by** —
