---
id: G5
title: "Review every public doc comment"
epic: release
status: resolved
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

## Resolution

**Shipped** (2026-10-06) — every block in `dist/index.d.ts` rewritten against a
measured peer baseline rather than the repo's own conventions document.

### The baseline

`scripts/doc-comment-stats.mjs` reads a `.d.ts` tree and reports, per library,
how many declarations carry a doc block and how long the blocks are. Run on the
published tarballs of nine comparable packages, the ones whose hover text is
their reference documentation came out like this:

| Library                      | Root blocks, lines / words | Member blocks, lines / words | Members documented |
| ---------------------------- | -------------------------- | ---------------------------- | ------------------ |
| `react-aria-components` 1.21 | 3.4 / 15                   | 4.3 / 12                     | 90%                |
| `@base-ui/react` 1.8, slider | 3.6 / 12                   | 4.4 / 17                     | 61%                |
| `@zag-js/slider` 1.45        | none                       | 3.8 / 12                     | 48%                |
| `@vidstack/react` 1.15       | 7.9 / 27                   | 4.8 / 19                     | 25%                |
| `react-use-audio-player` 4.0 | 4.3 / 20                   | 1.1 / 11                     | 91%                |
| `@radix-ui/react-slider` 1.5 | none                       | 8 / 39                       | 5%                 |
| **this package, before**     | **9.9 / 62**               | **4.5 / 26**                 | 57 blocks          |
| **this package, after**      | **5.4 / 33**               | **2.2 / 12**                 | 89 blocks          |

Two things the peers agree on: a public symbol gets one to three sentences
leading with what it is and what element it renders, and nearly every member
gets one sentence with a `@default` where there is one. `@example` is rare
(2 of 216 blocks in Base UI's slider, none in React Aria Components). Radix,
Zag and Headless UI carry almost nothing because their documentation is a
website; this library has none (D8), so the roots keep a sentence or two more
than theirs.

### What changed

- 151 blocks now, 3 longer than 15 lines, all three because of an `@example`
  (`AudioPlayer`, `Timeline`, `PlayerLabels`). The other four examples are cut:
  the README has each one.
- No ticket IDs. The one inline `//` comment that gained a reason
  (`KeyboardAction`'s list) sits above the JSDoc so the block still attaches.
- 32 members that had no comment now have one: every `children`, every method
  and field of `AudioPlayerControls` and `AudioPlayerState`, `AudioFile.src`,
  the three `SliderAriaState` fields, `useTimeDisplay()`'s two numbers, the
  button bag's `type`, `aria-label` and `aria-pressed`.
- Every component block now names the element it renders and its `data-part`,
  in the sentence shape Base UI uses ("Renders a `<div>` element").
- One wrong fact fixed: `AudioPlayerState.isDisabled` pointed at
  `useIsDisabled()`, which the package does not export.

### Facts that moved out of the JSDoc, and where they live

| Fact                                                                              | Home                                                            |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Spread the bag last; handlers passed in compose, handlers added after replace     | README "Props hooks"                                            |
| `aria-disabled`, never `disabled`; style from `[aria-disabled="true"]`            | README "Accessibility"                                          |
| Loading disables nothing, and why; an autoplay refusal disables nothing           | README "Accessibility", "`useIsSeekable()`"                     |
| State in one place: changing name, no `aria-pressed`; `.Set` is the exception     | README "Accessibility"                                          |
| Slider roots carry no role; add `role="group"` when composing more controls in    | README "Accessibility"                                          |
| One focusable element per slider, unlike APG/Radix                                | README "Accessibility"                                          |
| Object entries of `labels` cross the RSC boundary, function entries do not        | README "One rule, two shapes"                                   |
| `labels.player` is also set on `<audio>`, where it is not announced               | README "The table" note; A16                                    |
| `preload="none"` is `"paused"`, not `"loading"`                                   | README "`useIsBuffering()`"; S34                                |
| A stream that turns finite stops being live on `durationchange`                   | README "`useIsLive()`"                                          |
| Chrome parks about 0.5 s past `duration`                                          | README "`useIsAtEnd()`"; inline in `derived.ts`                 |
| React 19 hoists the fill's `<style>`, React 18 renders it per fill                | inline in `SliderProgress.tsx`; S28                             |
| Rate range measured in Chromium 151 / Firefox 153                                 | `RATE_LIMITS` in `sideEffectActions.ts`; C14                    |
| `--offset` reads `0px` until measured; both custom properties stay in range       | README "Custom properties"                                      |
| `.Current` children are always in the DOM, so a presence check cannot tell states | README "Playback rate"                                          |
| `rate` on `.Set` is not clamped to the slider's range                             | kept on the prop, one sentence                                  |
| The thumb's grab offset does not jump the value                                   | dropped: expected behaviour, nothing a caller writes depends on |

Found along the way, filed as **S35**: `usePlayerRootProps` has no declared
return type, so the `.d.ts` spells out every `HTMLAttributes` member, about
270 lines of hover text.

**Verified by** — `pnpm build && pnpm check-docs` (44 exports documented);
`grep` for `\((A|S|B|C|D|F|G|P|T)[0-9]+\)` in `dist/index.d.ts` finds nothing;
`node scripts/doc-comment-stats.mjs` for the numbers above; `pnpm lint`,
`pnpm format:check` and `pnpm type-check` clean.
