---
id: A16
title: "`labels.player` names an element outside the accessibility tree"
epic: accessibility
status: resolved
severity: P3
origin: assessment
breaking: false
evidence: [code-reading]
---

`AudioElement` renders `<audio aria-label={labels?.player ?? "audio player"}>`
without the `controls` attribute. An `<audio>` with no controls has no
rendering and no accessible object in Chromium or Firefox, so the name is
computed for nothing: no screen reader announces it, and no test can observe
it short of reading the attribute back.

So the first entry in `PlayerLabels` is close to inert, and the README's
localisation table presents it alongside entries that are not. Not wrong,
since the attribute is harmless, but misleading about what translating it
buys.

Related to **A10**: the element a name _would_ reach is the wrapper the library
does not render. If A10 resolves as "no wrapper, the consumer names their
container", then `labels.player` has no job and should say so in its doc
comment, or go. If A10 adds a wrapper, the entry moves to it.

## What to do

Decide with A10. Until then, note in the `player` doc comment and the README
table that the name is on the hidden element and is not announced.

## Resolution

**Documented** (2026-10-01) — A10 resolved as no wrapper, so the entry has no
element to move to. The `player` doc comment and a note under the README's
labels table both say the name is on the hidden element and is not announced,
and point at `role="region"` on the consumer's container. The entry stays
because it is harmless and removing it buys nothing a consumer can observe;
dropping it before 1.0 remains open to whoever next touches `PlayerLabels`.

**Verified by** — reading the comment in `dist/index.d.ts` after a build; it
sits on the leaf, where tsup keeps it.
