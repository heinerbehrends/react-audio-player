---
id: F2
title: "`audioFiles` is an array that ignores index 1+"
epic: features
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
also: [S6]
---

`AudioElement.tsx:11` — `const { src } = audioFiles?.[0] || {};` is the only read. No
iteration, no `currentIndex`, no `NEXT_TRACK`. The plural name and array type promise a
playlist and deliver one track. Deferring the _feature_ is right; shipping the _array-shaped
prop_ ahead of it is what freezes the mistake.
Also: `audioFiles={[]}` type-checks, renders `<audio>` with no `src`, and disables every
control permanently with no error.
Fix: either rename to `audioFile: AudioFile` (singular) or ship the minimum playlist.

## Resolution

**Shipped** — `audioFiles: AudioFile[]` → `audioFile: AudioFile`

**Verified by** — The array never read past `[0]`
