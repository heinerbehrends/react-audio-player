---
id: S36
title: "Two vocabularies for one set of operations"
epic: surface
status: resolved
severity: P2
origin: assessment
breaking: true
evidence: [code-reading]
---

Found in the pre-beta review of 2026-10-08. There are two ways to tell the
player to do something, and they do not cover the same ground.

In code you call a method from `useAudioPlayer()`: `play`, `pause`, `toggle`,
`seek`, `seekBy`, `setVolume`, `toggleMute`, `setRate`. In
`shortcuts` you write an action object from `KeyboardAction`:
`{ type: "SET_TIME_FORWARD", value: 30 }`. Same operation, two spellings, and
a developer building a player has to learn both lists and remember which one
can do what:

- A key can stop, unmute, jump to a fraction of the duration, and step the
  volume or the rate. The hook cannot do any of those.
- The hook can set an absolute volume or position. A key cannot: the slider
  commit, `CHANGE_VALUE`, is deliberately not bindable (S15).

Because `KeyboardAction` is public through `shortcuts`
(`src/AudioElement/sideEffectActions.ts`), 1.0 freezes sixteen internal action
names forever.

## Where the vocabulary lives today

Measured 2026-10-08:

| What                                                    | Count                |
| ------------------------------------------------------- | -------------------- |
| Action types, the switch, the key map, the controls map | 654 lines in 4 files |
| Action sends across `src/`                              | 83 in 14 files       |
| Action references in tests                              | 110 in 9 files       |
| Action-related lines in the published `.d.ts`           | 19                   |

The action union is 135 lines of pure types. `handleSideEffect` is seventeen
`case` blocks whose bodies are the real code. `send` in `createPlayerStore`
inspects action types before handling to record play intent, and inspects the
result afterwards to catch the refusal, so the knowledge about one operation
is split across three places.

## Proposal

One list of verbs, and the shortcut map takes the same functions you call from
code. The binding receives the object `useAudioPlayer()` returns, built from
the atoms at keydown time, so a digit key can read `duration`:

```jsx
shortcuts={{
  f: ({ seekBy }) => seekBy(30),
  "5": ({ seek, duration }) => seek(duration * 0.5),
  p: null,
}}
```

The controls become a strict superset of what the keys can do. Twelve verbs
cover every default shortcut and every button in the examples:

`play`, `pause`, `toggle`, `stop`, `seek`, `seekBy`, `setVolume`,
`adjustVolume`, `setMuted`, `toggleMute`, `setRate`, `adjustRate`.

What each new one is for, from the use cases that came up:

- `stop` — the `s` key today; nothing else reaches it.
- `setMuted(boolean)` — separate mute and unmute buttons in settings panels
  and call-style UIs, where a toggle is racy against state the caller did not
  observe. `UNMUTE` exists internally today; `MUTE` does not.
- `adjustVolume(delta)` — plus and minus buttons for TV-remote or
  coarse-pointer layouts, and the arrow keys. Keeps `DECREASE_VOLUME`'s
  mute-at-zero rule and `INCREASE_VOLUME`'s no-unmute rule.
- `adjustRate(delta)` — `.Change` and the `<` `>` keys. After F15 this is
  `setRate(rate + delta)`, clamped to `rateRange`; no bounds argument.

Not needed, and withdrawn after discussion: a `seekToFraction`. No common
button jumps to a percentage; YouTube's digit keys exist because a key cannot
carry a duration, and with the function form they are `seek(duration * 0.5)`.
Preset-level volume buttons are not a thing in web players either.

The action union, the switch, the `send` type-sniffing and the `useMemo` that
maps eight methods onto eight action objects all go. The store exposes the
controls, built once in `createPlayerStore`, closing over the element and
reading the atoms at call time as `send` already does. `play()` records the
intent, calls the element and handles the promise in six consecutive lines;
`toggle()` is `paused ? play() : pause()` and the intent tracking falls out.
The key map stays about the same length, since `c => c.seekBy(10)` is as long
as the action object it replaces.

## Decided

- **Heiner, 2026-10-08:** likes the idea. The player is a client component
  anyway, so the shortcut map is built beside `labels`, which already needs a
  client module for its function entries. The data form's one advantage,
  crossing a server-component boundary, is moot, so the function form is the
  only form.
- F15 shipped first, on its own, so `adjustRate` carries no bounds and the
  "never against your own direction" rule is already gone.

## What has to be kept

Three things the current indirection does, and the factory must do too:

1. **Re-projection after a write.** Setting `element.volume` updates the
   property at once, but `volumechange` arrives a task later, and the volume
   and rate sliders display the store value during a drag. `send` re-reads
   volume and rate off the element the moment the write returns, inside the
   same event handler, so React batches the atom update into the slider's own
   render and the later echo changes nothing (P1-b). In the factory this is a
   wrapper on the six volume and rate controls, passing the same pinned flag
   `send` passes today. Not on `seek`: the timeline keeps a local value and
   waits for `seeked`, and the retain-until-changed rule in `useSlider`
   depends on that (C3, T1).
2. **The volume step's rules.** A decrease that would reach zero mutes instead
   of writing zero, and an increase does not unmute. Both live in
   `handleSideEffect` today and move into `adjustVolume` unchanged.
3. **Testing.** The switch is tested as a pure function: build a fake element,
   pass an action, assert on the element. The jsdom harness already accepts an
   injected store with a fake attached, so a test calls
   `store.controls.seekBy(10)` and asserts on the same fake. The 110 references
   across nine test files are rewritten, and the keyboard tests that assert
   on a mocked dispatcher assert on the element instead, which is where T9 and
   T10 already pushed them. Mechanical, but most of the cost of the change.

## Expected size

Net 150–250 fewer source lines, a smaller `.d.ts` (`KeyboardAction` and
`KeyToActionMap` replaced by one function type), and probably a small bundle
win, since the action literals are strings the switch compares. "AudioPlayer
only" has little headroom, so measure rather than assume.

## Done when

- `useAudioPlayer()` returns the twelve verbs, each with a one-sentence doc
  comment, and every default shortcut and every example button is written
  with them.
- `shortcuts` takes `(player) => void` or `null`; `KeyboardAction`
  and the action union are gone from `dist/index.d.ts`.
- `handleSideEffect`'s switch and `send`'s type checks are gone; the
  re-projection and the volume-step rules are pinned by the existing tests.
- `pnpm size` passes, with any raised ceiling named in `scripts/bundle-size.mjs`.
- README, `docs/keyboard.md`, `docs/custom-ui.md` and the custom-components
  example's `shortcuts.ts` use the function form.

## Resolution (2026-10-08)

Thirteen verbs, not twelve: `reload` joined from the pre-beta review, for the
retry that needed `audioRef`. Decided while building:

- `reload()` calls `load()` and plays again only if playback was wanted, the
  rule a track swap follows. `load()` pauses without a `pause` event, so the
  intent is read before it. A failure stops playback, so a retry button calls
  `play()` after it; a reconnect after a stall does not need to.
- Letters match either case: `p` covers Shift+P and Caps Lock, and `p: null`
  unbinds both. The default map lost its upper-case duplicates.
- A shortcut receives `useAudioPlayer()`'s object, read from the atoms only
  when a key matches.
- `useAudioControls()` returns the controls alone, with no subscription.
- The types are `Shortcut` and `Shortcuts`; `KeyboardAction` and
  `KeyToActionMap` are gone.

What changed:

- `src/store/createControls.ts`, moved from `handleSideEffect.ts`, builds
  the controls once per store: one function per verb, the same guards, and the
  re-projection on the six volume and rate controls. `send` and its
  type-sniffing are gone; the play intent is recorded by `play`, `pause`,
  `stop` and `toggle` themselves.
- `sideEffectActions.ts` became `src/AudioElement/rateRange.ts`, keeping only
  the range.
- The slider modes carry `step` and `commit` functions of the controls in
  place of action builders. Buttons, `<PlayerRoot>` and `<MediaSession>` call
  the controls.
- `seekBy` now clamps both ways: a negative step stops at 0 and a positive one
  at the duration, where the old forward and backward actions each clamped one
  side only.
- The live example and the reconnect recipe use `reload()` and no longer need
  `audioRef`.

**Verified by** — `createControls.test.ts` (moved from
`handleSideEffects.test.ts`) drives a real store against the fake element,
including `reload` with and without playback wanted. The keyboard tests now
assert on the element rather than a mocked dispatcher, and cover case folding
and a shortcut reading `duration`.
