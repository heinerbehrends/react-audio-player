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

## Evidence from the podcast example (2026-10-06)

`examples/podcast` builds chapters in userland: a sorted list,
`useCurrentSecond()` and `seek()`, about fifteen lines. That is the case for
leaving the list itself out of the library. The one snag: `useCurrentSecond()`
is floored, so a chapter start at 115.75 has to be compared floored too, or a
click on that chapter marks the one before it for a moment.

The `<Timeline>` marks this ticket proposes are userland too: a span per
chapter inside `<Timeline.Control>`, at `start / duration` as a percentage,
`aria-hidden` because the chapter list is the accessible version. About fifteen
lines with their CSS. They need `z-index: 2` to sit over the fill, which the
README's layer order (`0`, `1`, `2`) already documents. So neither half needs
a library primitive yet.
