---
id: C13
title: "`AUDIO_FILE_ENDED` is a dead action"
epic: architecture
status: open
severity: P3
origin: assessment
breaking: false
evidence: [code-reading]
---

`src/AudioElement/sideEffectActions.ts` declares `AudioFileEndedAction`, folds
it into `SideEffectAction`, and documents it as "the end-of-track signal" that
is deliberately kept out of `KeyboardAction`. `handleSideEffect` handles it as
`currentTime = 0; pause()`, sharing a case with `STOP_AUDIO`.

Nothing dispatches it. The one grep hit outside its own definition is that
`case` label. The rewind it performed was removed when `AudioElement` started
passing `onEnded` straight through (F7, B4), and the action outlived the call.

The cost is small but real: the `KeyboardAction` doc comment spends a paragraph
explaining why a key cannot bind to something that no longer exists, and the
README's `onEnded` row (**G3**) still describes the rewind this action did.

## What to do

Delete the type, the `SideEffectAction` member and the `case`. Reword the
`KeyboardAction` comment so it excludes only `CHANGE_VALUE`. Check
`testJSDom/AudioElement/` for a test that sends it.
