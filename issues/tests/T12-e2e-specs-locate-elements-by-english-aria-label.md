---
id: T12
title: "E2E specs locate elements by English `aria-label`"
epic: tests
status: open
severity: P3
origin: backlog
breaking: false
evidence: [code-reading]
---

`testE2E/test-utils.ts:218` exports an English label fixture, and roughly ten specs use it to
**find** elements:

```ts
const timeline = page.getByLabel(labels.timeline); // "Timeline slider"
await page.getByLabel(labels.seekForward).focus();
```

Which is the thing the library warns consumers not to do, in its own source
(`useComposedButtonProps.ts:59-62`):

> A stable selector, because `aria-label` is not one: `button[aria-label="Play audio"]`
> breaks the day the app ships in German.

**A15** is that day. The suite is the German app.

## Two things that look alike, and only one is a problem

- **Asserting the name** — `expect(playButton).toHaveAttribute("aria-label", "Pause audio")`
  — is testing the accessibility contract. `toggle-play.spec.ts:27,35,47` is right to do it,
  and it should stay.
- **Locating by the name** — `page.getByLabel("Timeline slider").click()` — is using a
  translatable string as an ID. `data-part` exists for exactly this, and every part carries
  one (S9).

Only the second needs converting.

## Scope

Split out of **A15** deliberately. A15 fixes the one spec that breaks under it —
`rate-drag.spec.ts:78`, which locates the rate display by the `aria-label` A15 deletes —
because that one is a build break, not a cleanup. Converting the rest inside A15 would bury
a public-API change under a large test diff.

Not urgent: nothing is failing. It becomes urgent the first time someone points the E2E app
at a non-English `labels` bag, which is a plausible way to test A15 end to end and is the
natural follow-up.
