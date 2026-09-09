---
id: D6
title: "The podcast surface: chapters and markers first, transcript sync second"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

Chapter navigation, a transcript that follows playback, a sleep timer, silence
skipping and per-show speed are what podcast listeners now treat as baseline;
Podlove's Simple Chapters is an established web format for the first two. Two of
them fit the existing architecture almost for free — chapters and transcript
sync are both a sorted list plus `useCurrentSecond()`, and both want the same
new primitive: a `<Timeline>` that can render marks at positions, which is also
what **D5** and the buffered bar in section 3 want. The sleep timer and silence
skipping are userland and should stay there.

This is also the answer to "why not use the video player", which is worth being
able to give before it is asked.
