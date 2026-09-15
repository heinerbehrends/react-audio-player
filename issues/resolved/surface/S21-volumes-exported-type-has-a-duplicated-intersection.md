---
id: S21
title: "`Volume`'s exported type has a duplicated intersection"
epic: surface
status: resolved
severity: P3
origin: review
breaking: false
---

(`dist/index.d.ts:203-213`),
an artifact of the `Object.assign(X as Y, {...})` pattern. Harmless, but it's the first
thing a consumer sees in their editor.

## Where it stands

`Volume`'s exported type carries a duplicated intersection in `dist/index.d.ts`, an artifact of the old `Object.assign(X as Y, {…})` pattern. Harmless, but it is the first thing a consumer sees in their editor.

## Resolution

**Closed by an earlier change** — The duplication was an artifact of `Object.assign(X as Y, {…})`, which **P1-a** replaced with property assignment to keep the library tree-shakeable. The rebuilt `dist/index.d.ts` declares `declare const Volume: VolumeComponent;` — one named type, and the same for `Timeline` and `PlaybackRateSlider`. Nothing left to do but confirm it.

**Verified by** — the built `dist/index.d.ts`, as **C6** was.
