---
id: G3
title: "Four README sentences the code contradicts"
epic: release
status: open
severity: P1
origin: assessment
breaking: false
evidence: [code-reading]
---

The README is the beta's documentation, and on 2026-10-01 it disagreed with the
code in four places. Each is a one-line edit.

1. **The title** still reads "React Headless Audio Player (in development)".
2. **The `onEnded` row** in the `<AudioPlayer>` props table says the callback
   fires "after the element has been returned to the start". It does not: the
   element parks at the end, `AudioElement` passes `onEnded` straight through,
   and `testE2E/Timeline/ended.spec.ts` pins exactly that. The sentence
   describes the rewind that **C13**'s dead action used to perform. The JSDoc
   on the prop is already right; the table lags it.
3. **The roadmap** lists "Multi-language support" after `labels` shipped
   (A15), and "Initial beta release" as a future item in the document that
   accompanies it.
4. **The live-streams paragraph** under Requirements says they are not
   supported. Play, pause, volume, mute and rate all work on an unbounded
   duration; only the timeline and the seek buttons are gated, through
   `useIsSeekable()`. **D4** has the rewrite; the paragraph can change before
   the `isLive` signal does.

Also worth a sentence each while the file is open: **D3** (iOS ignores
`volume`), **B4** (Firefox fires `ended` on a paused seek to the end) and
**B1** (a playlist advance arrives paused). All three already contain their
paragraph.
