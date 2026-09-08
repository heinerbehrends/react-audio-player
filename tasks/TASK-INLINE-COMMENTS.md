Task: audit and improve the inline comment surface
Improve the // comments in src/. Documentation-only pass — do not change behaviour, and do not touch /** */ JSDoc on exported symbols (a separate pass covers the public API).

Scope
Every // comment in src/, plus block comments that are explaining implementation rather than documenting an exported symbol. Test files are out of scope unless a comment there is actively wrong.

If a comment turns out to be aimed at a caller rather than a maintainer, don't rewrite it here — flag it in the report as belonging in JSDoc, and leave it.

The audience test
An inline comment surfaces nowhere. No tooltip, no generated docs. Its only audience is someone editing that exact line, right now — and that invisibility is the filter. It earns its place only if it's needed at the moment of editing.

Keep a comment only if it fits one of these six:

Why not the obvious alternative. Answers "why isn't this simpler?" before the reader tries the simpler thing and breaks it.
Non-local ordering constraints. Correctness depends on position, which position itself cannot express — e.g. a prop that must come after a spread.
Empirical facts not derivable from the code. Browser behaviour, platform quirks, measured latencies, observed error types. Nobody rediscovers these by reading harder: which media writes throw and with what error, why a ResizeObserver needs a bail-out, how long an element takes to echo a seek back.
Deliberate spec deviations, with the reason.
Deliberate absence. Documents a non-decision, so nobody "fixes" the gap later — e.g. a key deliberately left unmapped. Nothing else can hold this: a test pins behaviour but not intent.
Pointers to external authority. A spec section, a WCAG criterion, an issue number, a finding ref.
Delete comments that:

Restate the line
Repeat the identifier immediately below them
Are section banners in a file short enough to read straight through
Teach the language or the framework
Record change history — git owns that
Are commented-out code
Before keeping any comment, try to convert it
In this order. Each step makes the knowledge harder to lose:

Rename — a good name deletes the comment that explained the expression
Extract — a named function is a comment that type-checks
Encode in the type — make the illegal state unrepresentable and the warning becomes unnecessary
Assert — documents and enforces
Test — a test named for the invariant fails when the invariant breaks; a comment does not
Move to JSDoc — if the audience is a caller
Move to a doc or ADR — if it's cross-cutting rationale or a rejected alternative
Only what survives all seven belongs inline. In practice that's mostly categories 3 and 5 above.

Two limits on this ladder:

Where step 5 is the right answer, do not write the test in this pass. Note it as suggested coverage and leave the comment. A documentation pass should not grow the test suite silently.
Steps 1–3 change code. Keep any such change minimal and provably behaviour-preserving, and call it out in the report. If a rename or type change is anything more than local, propose it instead of doing it.
Style for what you keep
MDN tone: factual, direct, present tense. No storytelling, no rhetorical flourishes, no narrating the reader's emotional state
Shorter is better — but never at the cost of the reason. A comment that keeps the what and drops the why is worse than no comment at all
Do not add comments where none existed unless the fact fits a category above and is genuinely not inferable
Match each file's existing conventions: dash style, backtick usage, reference format, line width
Preserve cross-references
Refs like A4, S9, T1 point at REVIEW-FINDINGS.md and BACKLOG.md. They are load-bearing — they point at reasoning rather than duplicating it. Keep them, keep their format, and do not inline the reasoning they point to.

Report, don't just edit
A comment audit is unreviewable without this, because a diff shows what remains, not what was judged:

Deleted — the comment, and which category of redundancy
Rewritten — before/after, one line on what the old one padded or omitted
Converted — what became a name, a type, or an assertion
Suggested tests — comments that should become tests, not written here
Belongs in JSDoc — comments aimed at callers, left in place for the other pass
Left alone deliberately — anything you judged fine that might otherwise look like an oversight
Verify
npx tsc --noEmit --project tsconfig.app.json, npx eslint ., npx prettier --check ., npx vitest run — all green, behaviour unchanged. The react-refresh/only-export-components warning in testJSDom/testComponents.tsx is pre-existing and expected.