---
id: G5
title: "Review every public doc comment"
epic: release
status: open
severity: P1
origin: backlog
breaking: false
evidence: [measured]
---

The doc comments that reach `dist/index.d.ts` are what a consumer's editor
shows on hover: next to the README, they are the library's documentation. They
have grown the way the README has, one fix at a time, and nobody has read them
as a whole.

Measured on 2026-10-06 in `dist/index.d.ts`: 119 doc blocks, 755 lines. 27
lines cite a ticket ID, such as "(A4)" or "(A11)", which a consumer cannot look
up. 8 blocks run past 15 lines. `pnpm check-docs` (B10) proves each export has
a comment; it cannot say whether the comment is right.

## Check each comment for

- **Accuracy.** Today alone changed what several of them describe: refs on
  every part (D2), the download bar (B9), a network error after data (B12), and
  the slider modes (P4). A comment that is wrong is worse than none.
- **No ticket IDs.** The reason stays and the ID goes; the history is in
  `issues/`.
- **Length.** One sentence per prop or field. One short paragraph for a
  component or hook, plus an `@example` where the usage is not obvious.
- **What the caller needs.** Units, ranges, defaults, when it is disabled, and
  what it carries for styling (`data-part`, `data-state`). How it was built, and
  which browser was measured, belongs in `issues/` unless it changes what the
  caller writes.
- **Plain, present tense**, in the tone the repo's comment conventions set.

## Order with G4

G4 moves detail out of the README into the JSDoc, so the two meet. Do this
first: settle what each part's comment says, then let G4 link to it rather than
repeat it.

## Done when

- Every block in `dist/index.d.ts` has been read and either kept, fixed or cut.
- No public comment cites a ticket ID.
- `pnpm check-docs` passes.
- The PR lists any fact that moved, and where to.
