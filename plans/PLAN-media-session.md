# Plan: Media Session (F6)

**F6** asks for the lock screen, the headphone buttons, the OS media keys and the
car head unit. For an audio library it is the most visible platform integration
there is, and the one beta users will ask for first. `AudioFile` has carried
`title`, `artist`, `album` and `artwork` since F3 for exactly this, so nothing
here is breaking. This plan settles where the code lives, which is the whole
decision, then lands it in four phases.

## Status: draft 2026-10-05 — awaiting the decisions marked **open**.

---

## What the API is, in the terms this library already uses

`navigator.mediaSession` is one global per page with three parts:

| part                           | what the OS does with it                            | what the library already has                |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------- |
| `metadata: MediaMetadata`      | title, artist, album and artwork on the lock screen | the four fields on `AudioFile`              |
| `setActionHandler(action, fn)` | play, pause, stop, seek buttons, previous, next     | `SideEffectAction` and `store.send`         |
| `setPositionState({...})`      | a live scrubber: duration, position, rate           | the `duration`, `currentTime`, `rate` atoms |
| `playbackState`                | which of play/pause the OS button shows             | the `paused` atom                           |

Browsers wire the bare minimum themselves: Chrome and Safari pause and resume
a playing `<audio>` from the headphone button without any code. Everything
else is blank until the page sets it, so today a consumer gets "Untitled" and a
generic icon.

Support: Chromium, Safari (macOS and iOS) and Firefox all have `metadata` and
`setActionHandler`. `setPositionState` is absent in older Firefox, so it is
feature-tested on its own rather than assumed from the parent object.

## The one structural decision: a part, not a prop

**Media Session ships as `<MediaSession />`, a component rendered inside
`<AudioPlayer>`, not as behaviour of the root.** Three reasons, in order of
weight.

1. **The bundle budget.** Every consumer imports `AudioPlayer`, and it always
   renders `AudioElement`, so code in either is paid by everyone. The "Full
   surface" row in `scripts/bundle-size.mjs` sits at 7745 B of an 8500 B gzip
   budget. Metadata, six handlers, position state and the ownership rule below
   are an estimated 600–800 B gzipped: inside the root that spends the whole
   remaining headroom on a feature a sound-effect player never wanted, and
   undoes the P1-a tree-shaking win for the `AudioPlayer` import itself. As a
   part it costs nothing until imported, and gets its own budget row.
2. **Opt-out becomes "do not render it".** A sound effect, a preview clip or a
   notification chime should not take over the lock screen. A `mediaSession`
   prop on the root would need a boolean, a default and a doc paragraph; a part
   needs none of them.
3. **It is where the consumer-provided handlers belong.** Previous and next
   track cannot be derived — the library has no playlist, by design (B2) — so
   they are props. `AudioPlayer` already has six; `onPreviousTrack` and
   `onNextTrack` next to `onEnded` would read as if the root knew about tracks.
   On `<MediaSession onNextTrack={…} />` they read as what they are.

It renders nothing. It reads `audioFile` from `usePlayerConfig()` and the store
from `usePlayerStore()`, so it has the same "inside an `AudioPlayer`" contract
as every other part, and the existing context guards cover misuse.

```jsx
<AudioPlayer audioFile={{ src, title, artist, album, artwork }}>
  <MediaSession
    onPreviousTrack={() => setIndex((i) => i - 1)}
    onNextTrack={() => setIndex((i) => i + 1)}
  />
  {/* the rest of the UI */}
</AudioPlayer>
```

## Decisions already taken

Recorded so they can be argued with.

**Handlers send the actions the keyboard map sends.** `play` → `PLAY`, `pause` →
`PAUSE`, `stop` → `STOP_AUDIO`, `seekbackward` → `SET_TIME_BACKWARD`,
`seekforward` → `SET_TIME_FORWARD`, `seekto` → `CHANGE_VALUE` on the timeline.
No new action types. The OS buttons, the `j`/`l` keys and `<SeekButton>` then
share one code path and cannot drift, and the seekable gate in
`handleSideEffect` applies to all three: a live stream ignores the OS skip
buttons exactly as it ignores `<SeekButton>`.

**Seek offset defaults to 10 seconds, and the OS wins when it says.** The
`seekbackward`/`seekforward` details carry an optional `seekOffset`; use it when
present, else `seekOffset` prop, else 10, which is the README's `<SeekButton>`
example. One prop, not two.

**`previoustrack` and `nexttrack` register only when their prop is passed.** An
unregistered handler hides the button on every platform, which is the right
outcome for a single track. Registering a no-op would show a button that does
nothing.

**Metadata is keyed on content, not identity.** `AudioFile`'s JSDoc promises
"safe to pass as an inline literal; nothing memoises on its identity", and
`artwork` is an array. The metadata effect depends on a serialised string of
the four fields, not on the object, or an inline literal would rewrite the lock
screen on every render.

**Metadata is set only when at least one of the four fields is present.** A
bare `{ src }` sets nothing, so a consumer who renders `<MediaSession>` for the
buttons alone does not get a lock-screen card reading "Untitled".

**Position state is written from the atoms, not from renders.** The component
subscribes to `currentTime`, `duration` and `rate` with `atom.subscribe` inside
an effect and calls `setPositionState` from the callback, so a `timeupdate`
costs no React render. It writes only while `duration` is finite:
`setPositionState` throws `TypeError` on `Infinity`, which is a live stream,
and on `position > duration`, which Chrome produces for about 0.5 s after
`ended` (the README documents the overshoot under `useIsAtEnd()`), so position
is clamped to duration.

**`playbackState` is set explicitly from the `paused` atom.** The browser
guesses it from whichever media element it thinks is current, and with two
players on a page it guesses wrong. Setting it costs one line per transition.

**Everything is reset on unmount.** Handlers to `null`, metadata to `null`,
`playbackState` to `"none"` — but only if this instance is the owner, see next.

## Ownership: two players, one session

`navigator.mediaSession` is one object. Two `<MediaSession>` parts registering
in sequence means the last one mounted wins, which is almost always the wrong
one: the user pressed play on the other.

**Rule: the session belongs to the player that most recently started playing,
and it keeps it while paused.** Pausing does not release — the lock screen
should still show the paused track with a play button. Only another player
starting playback, or the owner unmounting, moves it.

Implementation: one module-level `let owner: symbol | null` in
`MediaSession.tsx`, one `Symbol()` per instance. On the `paused` atom going
`false`, an instance claims: it becomes the owner, and writes metadata,
handlers and playback state. Every write elsewhere in the component is guarded
on `owner === self`. On unmount, if owner, reset and clear.

This is the first module-level state in the library. B2 argued that a shared
registry is exactly what the per-player store avoids, and that argument stands
for the store. This is not a registry: it is a pointer to whoever last claimed
one browser global that is itself a singleton, and it holds no state of its
own. The E2E `multi-instance.spec.ts` already pins that two players are
independent; it gains a case that the session follows the one that played.

**open — simpler alternative:** document that `<MediaSession>` is for one
player per page and let the last mount win. Fewer lines, no module state; the
cost is a wrong lock screen for the two-player case, which is plausible on a
page listing episodes. Recommendation: the ownership rule. It is about twenty
lines.

## Open questions

- **The part's name.** `<MediaSession />` matches the platform and reads as
  what it does. The alternative, a `useMediaSession()` hook, saves a component
  but has to be called from somewhere, and that somewhere is a consumer
  component inside the root, which is more ceremony for no gain. Recommendation:
  the component, and no hook. **open**
- **Ownership rule or last-mount-wins.** Above. **open**
- **Should `onEnded` be anything to do with this?** No. A playlist advances
  from `onEnded` today and the new track's metadata follows from `audioFile`
  changing. `nexttrack` is a different event: the user asked, nothing ended.
  Decided, listed because it will be asked.

## Phases

Each phase is one commit with its tests and its ticket note, in the order
below. Phases 1 and 2 are the beta.1 deliverable; 3 and 4 can follow in the
same release or the next.

### Phase 1 — the part, and metadata

- `src/MediaSession/MediaSession.tsx`, exported from `src/index.ts` with its
  own line and a comment, like the hooks.
- Feature-guard the whole body on `"mediaSession" in navigator`; render
  nothing either way.
- Effect keyed on the serialised four fields: build `new MediaMetadata(...)`
  when any field is present, else leave `metadata` alone. Clear on unmount.
- Ownership stub: in this phase, every instance claims on mount. The real rule
  lands in phase 4 and replaces the stub without changing the tests here.
- Tests, jsdom: `navigator.mediaSession` does not exist there, so the test
  installs a fake with `vi.stubGlobal`-style `Object.defineProperty` on
  `navigator`, plus a `MediaMetadata` constructor that records its argument.
  Assert: metadata set from all four fields; nothing set for a bare `{ src }`;
  metadata rewritten when `title` changes and not rewritten when the same
  inline literal re-renders; `null` after unmount.
- Add a bundle-size row: "Full surface + MediaSession", so the cost is
  measured and the four existing rows prove it is not paid elsewhere.

### Phase 2 — action handlers

- Register `play`, `pause`, `stop`, `seekbackward`, `seekforward`, `seekto`,
  each sending through `store.send`. `previoustrack` and `nexttrack` only when
  the prop is passed. Null every handler on unmount.
- `seekOffset?: number` prop, default 10; the details' own offset wins.
- Tests, jsdom: the fake records handlers by name; invoke each and assert the
  action reaches the fake element (`play()` called, `currentTime` moved). The
  seekable gate: with `duration: NaN`, `seekforward` leaves `currentTime`
  alone. `nexttrack` absent from the registered set when the prop is absent.
- Tests, E2E (Chromium supports the API): read
  `navigator.mediaSession.metadata.title` back from the demo page. Handlers
  cannot be read back or triggered from page script — there is no getter and
  Playwright cannot press a hardware media key — so the handler path is
  unit-tier only. Say so in the spec.

### Phase 3 — position and playback state

- Subscribe to `currentTime`, `duration` and `rate` atoms in an effect;
  call `setPositionState` when `duration` is finite, with position clamped to
  it. Skip entirely when `setPositionState` is not a function.
- Subscribe to `paused`; set `playbackState` to `"playing"` / `"paused"`.
  `"none"` on unmount.
- Tests, jsdom: the fake records the last position state; drive `timeupdate`
  and assert; drive `durationchange` to `Infinity` and assert no further call;
  assert the clamp at `currentTime > duration`.

### Phase 4 — ownership

- Replace the phase-1 stub with the claim-on-play rule and the owner guard.
- Tests, jsdom: two `<AudioPlayer>`s each with `<MediaSession>`; play the
  second, assert its metadata is current; pause it, assert it still is; play
  the first, assert it took over; unmount the owner, assert the session is
  cleared and the other does not claim until it plays.
- E2E: one case on `multi-instance.spec.ts` reading `metadata.title` after
  playing each in turn.

## Documentation

- README: a `### <MediaSession>` section under Components, after Errors, with
  the example above, the ownership rule in one paragraph, and the note that
  previous/next buttons appear only with their handlers. The `AudioFile` block
  under `<AudioPlayer>` loses its "nothing reads these yet" comment.
- README roadmap: remove the Media Session item.
- CHANGELOG: an Added entry; the Known gaps entry goes.
- `AudioFile`'s JSDoc in `PlayerConfigContext.tsx`: "declared now so that
  adding Media Session support later is not breaking" becomes "read by
  `<MediaSession>`".
- F6 ticket: resolved with the phase that closes it; D9's refusal list gains
  "no playlist, so previous/next are yours", if D9 has landed by then.

## Not in this plan

- **Chapter marks or a queue on the lock screen.** The API has no concept of
  either; D6 owns chapters.
- **`hangup`, `togglecamera`, `togglemicrophone` and the other call actions.**
  Not an audio player's business.
- **Service-worker or background playback.** The session works while the tab
  is alive; keeping audio alive when the tab is discarded is a platform matter
  the library cannot affect.
- **Reading `MediaImage` sizes or picking artwork.** The array is passed
  through; the OS picks.

## Estimate

Phases 1 and 2 are half a day with tests. Phase 3 is two hours. Phase 4 is two
hours plus the two-player tests. One day in all, which matches the F6 ticket's
assessment, and nothing in it is breaking.
