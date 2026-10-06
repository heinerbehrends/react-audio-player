---
id: B10
title: "Nothing checks that doc comments reach the published `.d.ts`"
epic: packaging
status: resolved
severity: P2
origin: backlog
breaking: false
evidence: [verified]
---

A doc comment is only worth writing if a consumer's editor shows it, and the only
thing a consumer's editor reads is `dist/index.d.ts`. Nothing in the build or in
CI checks that a public symbol arrives there with its documentation, so a comment
can be written, reviewed and merged having done nothing at all.

Two ways it silently fails, both found in `dist/index.d.ts` rather than in
review:

- **Attached to the wrong node.** `PlaybackRate`'s block sat above
  `type PlaybackRateProps`, one declaration too early, so the doc emitted onto
  the props type and `declare function PlaybackRate` emitted bare. Hovering
  `<PlaybackRate>` showed nothing.
- **Never written.** `useAudioPlayer()` — the library's headline hook, with its
  own README section — had no doc comment at all.

Both are fixed. The class is not: the same mistake is invisible in a diff, since
the source looks correctly documented in every case.

## Where it stands

Wanted: a check over the built `dist/index.d.ts` that every name in its final
`export { … }` list is preceded by a doc comment, run after `tsup` and wired into
CI alongside `attw`. It is a dozen lines and needs no parser — the export list is
one line and each symbol is a top-level `declare`.

The same script could carry the narrower rule that catches the `PlaybackRate`
case at source: a doc block separated from its declaration by a `//` comment or
an intervening type attaches to the wrong node.

**Checked by hand on 2026-10-01** for the beta assessment (**G0**): all 38
names in the final `export { … }` list of a fresh `dist/index.d.ts` are
preceded by a doc comment. The check was the dozen lines described above —
split on `\r?\n`, since the emitted file has Windows line endings on this
machine, find each `declare` line, and look back over blank lines for a
closing `*/`. Not blocking the beta; wiring it into CI still is the ticket.

## Resolution

**Shipped** (2026-10-06) as `scripts/check-docs.mjs`, run as `pnpm check-docs`
and in CI after the build, beside `check-exports`. It fails when a name in the
final `export { … }` list of `dist/index.d.ts` has no doc comment above its
declaration, or when a member of an exported object of parts does.

The member rule is new since this ticket: with D2, `Time`'s parts became
`forwardRef` constants, the emitter inlined their types into
`declare const Time: { … }`, and every one of their doc comments was dropped
without a warning. A function whose return type is an object literal is left
out of that rule; its fields are return values, not parts.

**Verified by** — 44 exports pass on the current build. A copy of the
`.d.ts` with the doc stripped from `PlayButton` and from `Time.Elapsed` fails
with both named.
