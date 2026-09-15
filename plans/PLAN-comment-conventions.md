# Plan: comment conventions

How comments in this repo should read, derived from what comparable OSS
TypeScript libraries actually do rather than from taste. This is the standard the
comment pass applies, and the one a reviewer should hold new code to.

## What the peers do

Five libraries, sampled from source rather than from memory. Three are structural
peers (headless React primitives, a store, a media wrapper); two are the
declaration files consumers actually read in a tooltip.

| Library                            | Comment density           | JSDoc on public API                       | Typical inline comment       |
| ---------------------------------- | ------------------------- | ----------------------------------------- | ---------------------------- |
| `radix-ui` `slider.tsx`            | ~2% (15–20 in ~900 lines) | Props types **bare**; one `@defaultValue` | 1–2 lines, under 15 words    |
| `zustand` `vanilla.ts`             | ~2.5% (2 in ~80 lines)    | **None** — docs live on the website       | 1 line                       |
| `media-chrome` `state-mediator.ts` | Moderate, clustered       | Types only                                | 1–3 lines, names the browser |
| `@types/react` `index.d.ts`        | Low                       | 1–3 sentences + `@see`, `@version`        | 1 line, often a link         |
| `@react-aria/slider` `types.d.ts`  | —                         | **One sentence** per hook and per member  | —                            |

Verbatim, to fix the register:

```
// Prevent browser focus behaviour because we focus a thumb manually when values change.
// Touch devices have a delay before focusing so won't focus if touch immediately moves away from target (sliding).
// We cast because index could be '-1' which would return undefined
```

— Radix. And from `media-chrome`:

```
// Only works in Chrome currently. Safari doesn't allow triggering in an event listener.
// iOS requires webkit-specific events on the video.
```

Two properties hold across all five:

1. **Comments are rare and short.** Nobody writes a paragraph inline. The
   longest Radix comment is ~25 words.
2. **Browser quirks always survive the edit.** Every library keeps them, and
   every one names the browser in a single line. This is the category that earns
   its place everywhere.

`@react-aria` is the outlier worth copying for JSDoc: it generates a docs site
from doc comments, so every public symbol has one — and every one is a single
sentence.

## Where this repo stands

**1,293 comment lines against 2,645 lines of code — 32.8%.** Ten to fifteen times
the density of every peer. The content is unusually good; the length and the
duplication are the problem.

| File                               | Ratio |
| ---------------------------------- | ----- |
| `Player/AudioPlayer.tsx`           | 63%   |
| `Shared/useComposedButtonProps.ts` | 62%   |
| `store/derived.ts`                 | 60%   |
| `Player/ErrorMessage.tsx`          | 50%   |
| `TimeDisplay/TimeDisplay.tsx`      | 47%   |
| `store/syncFromElement.ts`         | 42%   |

Measured repetition of the same prose:

| Block                                              | Copies |
| -------------------------------------------------- | ------ |
| "Spread it last, onto a `<button>`…"               | 6      |
| "Asserted: TypeScript cannot prove…"               | 6      |
| "Last, so the gate and the shortcuts…"             | 6      |
| "The hook below is what the component is made of…" | 5      |
| "Live while loading; only an error disables it."   | 4      |
| "Give the root a height" / "silently inert"        | 3      |
| "`amount` is a leading argument rather than…"      | 3      |
| "No default value: with one, the guard…"           | 3      |

### The headline number needs splitting

32.8% is the wrong figure to chase, because the two populations answer to
different peers:

| Population     | Lines | Compare against                                   |
| -------------- | ----- | ------------------------------------------------- |
| Inline `//`    | 231   | Radix ~2%, Zustand ~2.5%, `media-chrome` moderate |
| JSDoc `/** */` | 1,019 | `@react-aria`: every public symbol, one sentence  |

Radix and Zustand carry almost no JSDoc because their documentation is a website.
This library has no docs site — that is open ticket **D8** — so the README and
the tooltips are the only documentation a consumer gets, and the JSDoc budget is
correspondingly larger. **The inline number is the one that should approach the
peers.**

## Outcome of the first pass

| Population     | Before | After | Target                |
| -------------- | ------ | ----- | --------------------- |
| Inline `//`    | 231    | 178   | 6.3% of code + inline |
| JSDoc `/** */` | 1,019  | 955   | every public symbol   |

117 comment lines net removed while _adding_ docs to five public symbols that had
none. Every repeated block above is now stated once. All 32 symbols exported from
`dist/index.d.ts` carry a doc comment, verified against the build rather than the
source — the check itself is ticket **B10**.

## One fact, one home

The rule the whole pass turns on. A fact belongs in exactly one of three places,
chosen by **who needs it and when**:

| Home       | Audience                        | Reaches them through      | Holds                                           |
| ---------- | ------------------------------- | ------------------------- | ----------------------------------------------- |
| **README** | Someone deciding or composing   | Reading front to back     | Narrative, cross-cutting rules, worked examples |
| **JSDoc**  | Someone calling the symbol      | Editor tooltip, `.d.ts`   | Contract: units, ranges, lifecycle, errors      |
| **Inline** | Someone editing that exact line | Nothing — it is invisible | The surprise that would otherwise be "fixed"    |

A fact in two homes is a fact that will disagree with itself. When the same
sentence appears in six tooltips, it belongs in the README with the tooltips
pointing at it — or it belongs on the one shared symbol the six delegate to.

## JSDoc

Public API only: everything reachable from `src/index.ts`, plus props-type
members, since those show in tooltips too.

**Lead with one sentence saying what the symbol is.** Then only what the
signature cannot say:

- Units, ranges, clamping — "seconds, not milliseconds"; "0–1, clamped on write"
- Lifecycle and call constraints — "call once, at the slider root"
- Error behaviour — what throws, what rejects, what silently no-ops
- Required composition — where it must be rendered, and what happens if it is not
- Deliberate deviations a consumer would otherwise file as a bug
- `@defaultValue`, `@example`, `@see`, `@deprecated` where they apply

**Budget: one sentence for a part, one short paragraph for a root.** A compound
root that a consumer composes (`Timeline`, `Volume`, `AudioPlayer`) earns more
than a leaf that only renders children. Past a paragraph, the surplus is
narrative and belongs in the README.

Delete JSDoc that restates the name, restates the type, or puts types in prose.
TypeScript is the source of truth for shape; a JSDoc type is a lie waiting to
happen.

**Verify in `dist/index.d.ts`, not in the source.** A doc comment that does not
survive the build has done nothing. Two rules follow from the `.d.ts`:

- Put the block on the `export const` / `export function`, not on the
  implementation it aliases and not on the props type above it.
- A doc comment separated from its declaration by a `//` comment or a type
  declaration attaches to the wrong node.

## Inline comments

An inline comment surfaces nowhere. Its only audience is someone editing that
line, which is the filter: it earns its place only if it is needed at the moment
of editing.

**Keep** — in practice almost always the first two:

1. **Empirical facts not derivable from the code.** Browser behaviour, platform
   quirks, measured numbers. Name the browser, like every peer does.
2. **Deliberate absence.** A key left unmapped, an attribute deliberately not
   emitted — so nobody "fixes" the gap later.
3. **Non-local ordering constraints.** Correctness depends on position and
   position cannot express it — a prop that must follow a spread.
4. **Why not the obvious alternative**, where a reader would otherwise try the
   simpler thing and break it.
5. **Pointers to external authority** — a spec section, a WCAG criterion, a
   ticket ref.

**Delete** — restatements of the line; the identifier repeated in prose; section
banners; language or framework tutorials; change history, which git owns;
commented-out code.

**Budget: one to three lines.** Past that, the comment is carrying rationale that
belongs in a ticket or the README, and the line should point there instead.

### Prefer eliminating the need

In this order — each step makes the knowledge harder to lose:

rename → extract a named function → encode in the type → assert → test → move to
JSDoc → move to the README or a ticket

Only what survives all seven belongs inline. Where a test is the right answer, do
not write it in a documentation pass: note it as suggested coverage and leave the
comment.

## Style

MDN tone: factual, direct, present tense. State the mechanism, not the story of
discovering it.

- No storytelling, no narrating what a past version did wrong unless the wrong
  thing is what a reader would otherwise reintroduce
- Shorter is better, but never drop the **why** to save a line. A comment that
  keeps the what and loses the why is worse than no comment
- Do not add comments where none existed unless the fact fits a category above
- Match each file's existing conventions: dash style, backticks, line width
- Ticket refs (`A4`, `S9`, `T1`) are load-bearing — they point at reasoning
  instead of duplicating it. Keep them and their format

## Worked examples

**Restating the code** — delete outright:

```ts
// Before
/** `MediaError.code` is a numeric enum; these are its four members. */
const MEDIA_ERROR_REASONS: Record<number, MediaErrorReason> = { 1: "aborted", … };

// After — the map is its own documentation
const MEDIA_ERROR_REASONS: Record<number, MediaErrorReason> = { 1: "aborted", … };
```

**A paragraph that is really one empirical fact** — keep the fact, drop the prose:

```ts
// Before (4 lines)
// `AbortError` means a `pause()` or `src` change overtook the request,
// which is what a double-click or a held key produces. The user's
// intent was honoured, so there is nothing to report.

// After (2 lines)
// A `pause()` or `src` change overtook the request — a double-click or a held
// key. The user's intent was honoured, so there is nothing to report.
```

**The same paragraph in six tooltips** — state it once, on the shared symbol,
and let the six reference it:

```ts
// Before, on each of six props hooks:
 * Spread it last, onto a `<button>` or a component that renders one. Pass your
 * handlers in rather than adding them after the spread, where the library
 * cannot compose them.

// After, on each of six:
 * Spread it last, onto a `<button>`. See {@link useComposedButtonProps}.
```

**Narrative in a tooltip** — move to the README, keep the contract:

```ts
// Before, on `useIsAtEnd` — five paragraphs including a measured Chrome number
// and a discussion of loop behaviour.

// After — the contract in the tooltip, the reasoning in the README:
/**
 * Whether the position is the end of the track.
 *
 * A statement about position, not history: dragging to the end reports `true`
 * with nothing having played, and it clears as soon as the position moves. Stays
 * `false` under `audioProps={{ loop: true }}`. Use `onEnded` for the edge.
 */
```

## Verification

Documentation-only. Behaviour must not change.

```bash
npx tsc --noEmit --project tsconfig.app.json
npx eslint .
npx prettier --check .
npx vitest run
npx tsup && node -e "…"   # doc comments must survive into dist/index.d.ts
```

The `react-refresh/only-export-components` warning in
`testJSDom/testComponents.tsx` is pre-existing and expected.
