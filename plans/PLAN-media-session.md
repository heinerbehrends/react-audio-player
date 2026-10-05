# Plan: Media Session (F6)

**F6** asks for the lock screen, the headphone buttons, the OS media keys and the
car head unit. For an audio library it is the most visible platform integration
there is, and the one beta users will ask for first. `AudioFile` has carried
`title`, `artist`, `album` and `artwork` since F3 for exactly this, so nothing
here is breaking. This plan settles where the code lives, which is the whole
decision, then lands it in four phases.

## Status: settled 2026-10-05 after a grill session — ready to build. Ships in `0.1.0-beta.0`; the publish waits for it.

---

## What the API is, in the terms this library already uses

`navigator.mediaSession` is one global per page with three parts:

| part                           | what the OS does with it                            | what the library already has                |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------- |
| `metadata: MediaMetadata`      | title, artist, album and artwork on the lock screen | the four fields on `AudioFile`              |
| `setActionHandler(action, fn)` | play, pause, seek buttons, previous, next           | `SideEffectAction` and `store.send`         |
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

**Component only, no exported hook.** The implementation is a hook,
`useMediaSession(props)`, and the component is that hook plus `return null`,
so a hook export is one line away if a consumer ever asks. It is not exported
now because nothing renders, so there is no markup for a consumer to own —
the reason the button hooks exist — and the second name would be the first
minus one line. Discoverability for the metadata fields comes from the
`AudioFile` JSDoc instead: each of the four says it is read by
`<MediaSession>`, which is where someone who passed a title and saw nothing
on their lock screen will hover first.

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
`PAUSE`, `seekbackward` → `SET_TIME_BACKWARD`, `seekforward` →
`SET_TIME_FORWARD`, `seekto` → `CHANGE_VALUE` on the timeline. No new action
types. The OS buttons, the `j`/`l` keys and `<SeekButton>` then share one code
path and cannot drift, and the seekable gate in `handleSideEffect` applies to
the skips: a live stream ignores the OS skip buttons exactly as it ignores
`<SeekButton>`.

**`play` and `pause` are two handlers, not one toggle.** The OS says which it
wants; toggling on a stale guess is how a headphone click resumes the track the
user just paused.

**No `stop` handler.** On desktop Chrome the X on the global media controls
fires `stop` when a handler exists and pauses when none does. `STOP_AUDIO`
rewinds as well, which is behaviour the consumer did not ask for from a button
every other site treats as pause. Unregistered, so the X pauses, like every
other player. A consumer who wants rewind-on-stop can bind a key to
`STOP_AUDIO` already.

**`seekto` checks the duration itself.** `CHANGE_VALUE` has no seekable gate,
because the slider that sends it is already disabled without a duration. The OS
has no such protection, and Android has shown a seek bar from the handler's
presence alone, so the handler drops the call when `store.duration.get()` is
not above zero. The `fastSeek` hint is ignored: the library has no fast-seek
path and the element's `fastSeek()` is Safari-only.

**Seek offset defaults to 10 seconds, and the OS wins when it says.** The
`seekbackward`/`seekforward` details carry an optional `seekOffset`; use it when
present, else the `seekOffset` prop, else 10, which is the README's
`<SeekButton>` example. One prop for both directions; separate distances can
become an object later without breaking anything. Both skips are always
registered — a skip needs nothing from the consumer, and podcast listeners
expect the buttons.

**`previoustrack` and `nexttrack` register only when their prop is passed.** An
unregistered handler hides the button on every platform, which is the right
outcome for a single track. Registering a no-op would show a button that does
nothing. Platform fact for the README: iOS shows either skip-track or skip-time
on the lock screen, not both, so passing `onNextTrack` replaces the 15-second
button on iPhone. Chrome on Android shows both.

**Metadata is keyed on content, not identity.** `AudioFile`'s JSDoc promises
"safe to pass as an inline literal; nothing memoises on its identity", and
`artwork` is an array. The metadata effect depends on a serialised string of
the four fields, not on the object, or an inline literal would rewrite the lock
screen on every render.

**Metadata is `null` when no field is present.** A bare `{ src }` writes
`null`, so a consumer who renders `<MediaSession>` for the buttons alone gets
no card reading "Untitled", and a playlist that swaps from a tagged track to a
bare one does not keep the old title on the lock screen. No fallback to
`document.title` or the filename: text the consumer never chose looks like a
bug on a lock screen. The component owns the metadata outright, the same rule
as the handlers; a consumer managing it by hand through `audioRef` would not
render the part.

**Position state is written once a second, from the atoms.** The OS
interpolates the scrubber from the last `position`, `playbackRate` and the
time of the write, so it needs a write only when something it cannot predict
happens. The component subscribes to `currentSecond`, `duration`, `rate` and
`paused` with `atom.subscribe` inside an effect, so nothing here costs a React
render, and `currentSecond` fires on every seek that crosses a second, which is
nearly all of them. Worst case is a seek within the same second, where the
scrubber is under a second off until the next tick. It writes only while
`duration` is finite: `setPositionState` throws `TypeError` on `Infinity`,
which is a live stream, and on `position > duration`, which Chrome produces for
about 0.5 s after `ended` (the README documents the overshoot under
`useIsAtEnd()`), so position is clamped to duration. Skipped entirely where
`setPositionState` is not a function.

**`playbackState` is set explicitly from the `paused` atom.** The browser
guesses it from whichever media element it thinks is current, and with two
players on a page it guesses wrong. Setting it costs one line per transition.

**The two calls that can throw are caught, and reported in development.**
`new MediaMetadata({ artwork })` throws `TypeError` on an artwork `src` that is
not a valid URL; `setPositionState` throws on inputs the guards above should
exclude but a browser may still reject. Either would otherwise throw inside an
effect and take the player tree down for a lock-screen image. Both are wrapped;
the failure is a `console.error` behind the `process.env.NODE_ENV` guard S14
introduced, and the player keeps working without the card or the scrubber. The
handlers need no wrapping: they call `store.send`, which already clamps and
gates.

**Everything is reset on unmount.** Handlers to `null`, metadata to `null`,
`playbackState` to `"none"` — but only if this instance is the owner, see next.

## Ownership: two players, one session

`navigator.mediaSession` is one object. Two `<MediaSession>` parts registering
in sequence means the last one mounted wins, which is almost always the wrong
one: the user pressed play on the other.

**Rule: the session belongs to the player that most recently started playing,
and it keeps it while paused.** Pausing does not release — the lock screen
should still show the paused track with a play button, as native players do.
An ended track is paused, so the finished track stays on the card until
something else plays. Only another player starting playback, or the owner
unmounting, moves it.

**Plus: an instance claims on mount when nobody owns the session.** Pure
claim-on-play would leave a single-player page writing nothing until the first
press, and Chrome builds the notification from whatever metadata is present
when playback starts, so setting it a tick later flashes "Untitled" on some
Android versions. With the mount claim, a single-player page behaves exactly as
if the root did it, and claim-on-play only matters once a second player exists.
Strict mode's double mount is sound: the cleanup releases only if this
instance is the owner, and the second run claims again.

Implementation: one module-level `let owner: symbol | null` in
`MediaSession.tsx`, one `Symbol()` per instance. Claim on mount if `owner` is
`null`, and on the `paused` atom going `false`. Claiming writes metadata,
handlers and playback state. Every write elsewhere in the component is guarded
on `owner === self`. On unmount, if owner, reset and clear.

**On the owner's unmount the session is cleared, not handed on.** Handing off
needs a list of mounted instances, which is the registry B2 refused, plus a
rule for who gets it. The other instances stay quiet until one of them plays.
The one visible edge: another player is still playing when the owner unmounts,
and the card goes blank mid-playback. For that, B must be playing, A must then
start, and A must unmount while B still plays — two players playing at once,
which B2 already leaves to the consumer. One README sentence names it.

This is the first module-level state in the library. B2 argued that a shared
registry is exactly what the per-player store avoids, and that argument stands
for the store. This is not a registry: it is a pointer to whoever last claimed
one browser global that is itself a singleton, and it holds no state of its
own. The E2E `multi-instance.spec.ts` already pins that two players are
independent; it gains a case that the session follows the one that played.

## Settled, listed because they will be asked

- **`onEnded` has nothing to do with this.** A playlist advances from `onEnded`
  today and the new track's metadata follows from `audioFile` changing.
  `nexttrack` is a different event: the user asked, nothing ended.
- **Why not root behaviour, when `AudioFile` already has the fields?** The
  bundle argument above. The fields were declared early so that the _type_ would
  not break; where they are read is this part.
- **Why no hook export?** Above, under the structural decision.

## Phases

Each phase is one commit with its tests and its ticket note, in the order
below. All four ship in `0.1.0-beta.0`: nothing is published yet, the work is
a day, and a first release that already has the lock screen is a better
announcement than one that promises it. The publish waits.

### Phase 1 — the part, and metadata

- `src/MediaSession/MediaSession.tsx`: an internal `useMediaSession(props)`
  hook and the `MediaSession` component over it. Exported from `src/index.ts`
  with its own line and a comment, like the hooks.
- Feature-guard the whole body on `"mediaSession" in navigator`; render
  nothing either way.
- Effect keyed on the serialised four fields: `new MediaMetadata(...)` when
  any field is present, `null` otherwise, inside the try/catch. Clear on
  unmount.
- Ownership: claim on mount when `owner` is `null`, with the owner guard. The
  claim-on-play half lands in phase 4.
- Tests, jsdom: `navigator.mediaSession` does not exist there, so the test
  installs a fake with `Object.defineProperty` on `navigator`, plus a
  `MediaMetadata` constructor that records its argument. Assert: metadata set
  from all four fields; `null` for a bare `{ src }`; rewritten when `title`
  changes and not rewritten when the same inline literal re-renders; `null`
  after unmount; an artwork URL the constructor rejects logs and leaves the
  player rendering.
- Demo: `src/App.tsx` renders `<MediaSession>` with a title and artist on the
  fixture track.
- E2E: one spec reading `navigator.mediaSession.metadata.title` back from the
  demo page after play. Chromium supports the API.
- Add a bundle-size row: "Full surface + MediaSession", so the cost is
  measured and the four existing rows prove it is not paid elsewhere.
- `AudioFile`'s four metadata fields get the "read by `<MediaSession>`" JSDoc.

### Phase 2 — action handlers

- Register `play`, `pause`, `seekbackward`, `seekforward`, `seekto`, each
  sending through `store.send`; `seekto` drops the call without a duration.
  `previoustrack` and `nexttrack` only when the prop is passed. Null every
  handler on unmount.
- `seekOffset?: number` prop, default 10; the details' own offset wins.
- Tests, jsdom: the fake records handlers by name; invoke each and assert the
  action reaches the fake element (`play()` called, `currentTime` moved). The
  seekable gate: with `duration: NaN`, `seekforward` and `seekto` leave
  `currentTime` alone. `nexttrack` and `stop` absent from the registered set.
- Handlers cannot be read back or triggered from page script — there is no
  getter and Playwright cannot press a hardware media key — so the handler path
  is unit-tier only. A comment in the E2E spec says so.

### Phase 3 — position and playback state

- Subscribe to `currentSecond`, `duration`, `rate` and `paused` in an effect;
  call `setPositionState` when `duration` is finite, with position clamped to
  it, inside the try/catch. Skip entirely when `setPositionState` is not a
  function.
- From `paused`, set `playbackState` to `"playing"` / `"paused"`; `"none"` on
  unmount.
- Tests, jsdom: the fake records the last position state; drive `timeupdate`
  across a second and assert one write; drive `durationchange` to `Infinity`
  and assert no further call; assert the clamp at `currentTime > duration`;
  assert `playbackState` follows `play` and `pause`.

### Phase 4 — ownership

- Add the claim-on-play half: on `paused` going `false`, claim and rewrite.
- Tests, jsdom: two `<AudioPlayer>`s each with `<MediaSession>`; the first
  mounted owns; play the second, assert its metadata is current; pause it,
  assert it still is; play the first, assert it took over; unmount the owner,
  assert the session is cleared and the other does not claim until it plays.
- E2E: one case on `multi-instance.spec.ts` reading `metadata.title` after
  playing each in turn.

## Documentation

- README: a `### <MediaSession>` section under Components, after Errors, with
  the example above; the ownership rule in one paragraph, including the
  blank-card edge; previous/next appear only with their handlers, and on iOS
  they replace the skip-time buttons; the X on desktop Chrome pauses. The
  `AudioFile` block under `<AudioPlayer>` loses its "nothing reads these yet"
  comment.
- README roadmap: remove the Media Session item.
- CHANGELOG: an Added entry in the `0.1.0-beta.0` section; the Known gaps entry
  goes.
- `AudioFile`'s JSDoc in `PlayerConfigContext.tsx`: "declared now so that
  adding Media Session support later is not breaking" becomes "read by
  `<MediaSession>`".
- F6 ticket: resolved with the phase that closes it; D9's refusal list gains
  "no playlist, so previous/next are yours", if D9 has landed by then.

## Not in this plan

- **Chapter marks or a queue on the lock screen.** The API has no concept of
  either; D6 owns chapters.
- **`stop`, `hangup`, `togglecamera`, `togglemicrophone` and the other call
  actions.** `stop` is argued above; the rest are not an audio player's
  business.
- **A `useMediaSession()` export.** One line away if asked for; see the
  structural decision.
- **Service-worker or background playback.** The session works while the tab
  is alive; keeping audio alive when the tab is discarded is a platform matter
  the library cannot affect.
- **Reading `MediaImage` sizes or picking artwork.** The array is passed
  through; the OS picks.

## Estimate

Phases 1 and 2 are half a day with tests, the demo and the first E2E spec.
Phase 3 is two hours. Phase 4 is two hours plus the two-player tests. One day
in all, which matches the F6 ticket's assessment, and nothing in it is
breaking. The one check that stays manual is a phone with the screen locked.
