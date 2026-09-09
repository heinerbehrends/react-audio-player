---
id: S21
title: "`Volume`'s exported type has a duplicated intersection"
epic: surface
status: open
severity: P3
origin: review
breaking: false
---

(`dist/index.d.ts:203-213`),
an artifact of the `Object.assign(X as Y, {...})` pattern. Harmless, but it's the first
thing a consumer sees in their editor.

## Where it stands

`Volume`'s exported type carries a duplicated intersection in `dist/index.d.ts`, an artifact of the old `Object.assign(X as Y, {…})` pattern. Harmless, but it is the first thing a consumer sees in their editor.
