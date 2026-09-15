---
id: S24
title: "A consumer's `onClick`/`onKeyDown` silently kills every button"
epic: surface
status: resolved
severity: P1
origin: backlog
breaking: true
evidence: [verified]
also: [S5, A14, D1]
---

**S5** and **A14** fixed handler composition on `SetSliderValue.tsx` and
`DragButton.tsx` — now `SliderControl` and `SliderThumb`. They never reached the six
buttons, which have the identical defect in both directions.

`onKeyDown` sits **before** the spread on every one of them:

```jsx
<button type="button" onKeyDown={handleMediaKeys} aria-label={…} {...props} {...disabled} />
```

So `<PlayButton onKeyDown={track}>` removes all 40 entries of `defaultKeyToActionMap`
from that button — `p`, `k`, `m`, `j`/`l`, `0`–`9`, every `Media*` key. Silent: the button
still renders, still announces, still plays on click. **F10** makes it worse, since
shortcuts only fire when a library control has focus, so the player's keyboard behaviour
now depends on which button you tabbed to.

`onClick` is replaced by the gate — `useDisabledButtonProps.ts:46` is
`isDisabled ? undefined : (theirs ?? ours)`. `<PlayButton onClick={track}>` compiles,
renders, and stops the player from playing.

Both hit all six: `PlayButton`, `MuteButton`, `SeekButton`, `Time.Toggle`,
`PlaybackRate.Set`, `PlaybackRate.Change`.

The asymmetry this leaves across the library:

```jsx
<Timeline.Control onKeyDown={track}>   // arrow keys still work — composed
<PlayButton onKeyDown={track}>         // 40 shortcuts gone — replaced, silently
<PlayButton onClick={track}>           // play/pause dies — replaced
```

Analytics is the case that built `composeEventHandlers` in the first place: S5's
motivating example is `<Timeline.Seek onKeyDown={analytics}>`. It is still the case that
cannot be served here. The workaround costs the consumer what the component exists to
know — calling `useAudioPlayer().toggle` beside `track()` means naming the button's own
action by hand, and re-creating the disabled gate badly, since a hand-rolled `toggle()`
fires on an errored track.

The `onClick` half is deliberate rather than accidental: documented on the hook
("`theirs` still replaces `ours`, as it did before the gate existed") and pinned by
`loadingState.test.tsx:206-221`, "runs the consumer's handler in place of ours once
seekable". The `onKeyDown` half looks like an oversight — nothing documents or tests it.

Proposed: compose both, matching S5 exactly — consumer first, library second,
`preventDefault()` opting out, and the gate still swallowing both while `aria-disabled`.
Moves `onKeyDown` after the spread, inverts the test above, and rewrites the hook's JSDoc.

**Breaking, and on a clock.** It changes behaviour for anyone relying on replacement.
`package.json` is `0.0.0` with no git tags, so today it costs nothing; after publish it
costs a major. This is the deadline **D1** attributes to the `asChild`/`render` choice —
that one is additive either way, this one is not.

## Resolution

**Shipped** — All six buttons compose the consumer's `onClick` and `onKeyDown` instead of
replacing them, on S5's rule: consumer first, library second, `preventDefault()` in theirs
opting out of ours, and the `aria-disabled` gate swallowing both. `composeEventHandlers`
moved from `src/Slider/` to `src/Shared/`, and the three props every button controls moved
into one `useComposedButtonProps` hook, so a control can no longer announce one predicate
and enforce another.

Two things landed with it. `customKeyboardShortcuts` gained `{ key: null }` to unbind a
binding, because composition alone leaves no way to turn a shortcut off —
`preventDefault()` in an `onKeyDown` would also cancel `Enter` and `Space` activation on a
`<button>`. And `SeekButton` gained the seekable gate: its action names a position on the
track, so it is now `aria-disabled` before metadata and on a live stream, where it
previously seeked against an unknown duration.

**Verified by** — 28 tests across `buttonHandlers.test.tsx` and
`useComposedButtonProps.test.tsx`, including the `preventDefault()` opt-out, the gate
swallowing the consumer's handler, and the seekable gate on `SeekButton`

The breaking half cost nothing: `package.json` is still `0.0.0` with no tags, so no
release ever carried the replace behaviour.
