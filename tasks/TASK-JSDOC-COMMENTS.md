Task: audit and improve the JSDoc surface
Improve the doc comments on this library's public API only. Documentation-only pass — do not change behaviour, and do not touch // inline comments (a separate pass covers those).

Scope
src/index.ts is the work list. Every symbol it exports is in scope, plus the compound members reachable through them:

Components and their members — Timeline.Control, Timeline.Progress, Timeline.Background, Timeline.Thumb, Volume._, PlaybackRate._, PlaybackRateSlider._, Time._, MuteButton.Muted / .LowVolume / .HighVolume, PlayButton.Playing / .Paused
Hooks — useAudioPlayer, useCurrentSecond, useCurrentTime, useIsBuffering, useAudioError
Types — AudioFile, SideEffectAction, KeyToActionMap, AudioPlayerState, AudioPlayerControls, AudioError, MediaErrorReason, PlayerState, VolumeState
Props types, since their members show in tooltips too
Anything not reachable from src/index.ts is out of scope.

The audience test
JSDoc is for people who use the symbol without reading its implementation. It reaches them through editor tooltips and generated docs — for many consumers it is the only documentation they will ever see. So it carries contract, not mechanism.

Write what the type signature cannot say:

Units, ranges, clamping — "seconds, not milliseconds"; "0–1, clamped on write"; "0 when the duration is unknown"
Lifecycle and call constraints — "call once, at the slider root"; "stable across renders"; "safe to call before metadata arrives"
Error behaviour — what throws, what rejects, what silently no-ops
Deliberate deviations from a spec or from consumer expectation — anything a consumer would otherwise file as a bug
Required composition — where a component must be rendered inside another to work, and what happens if it isn't
@defaultValue, @example, @see, @deprecated where they apply
Delete or rewrite JSDoc that:

Restates the name — /\*_ The play button. _/ on PlayButton
Restates the type — @returns a boolean, @param {string} src
Says nothing — @param volume - the volume
Puts types in JSDoc. Never do this in TypeScript; the signature is the source of truth and a JSDoc type is a lie waiting to happen
Test for every doc comment: if deleting it loses nothing a caller couldn't infer from the name and signature, delete it.

Specifically look for contract facts stranded outside the tooltip
The most valuable thing this pass can do is move facts a consumer needs from places they won't look into the place their editor shows them. Known candidates from recent work:

Controls are marked aria-disabled, not natively disabled, so consumer CSS must target [aria-disabled="true"] rather than :disabled — a breaking styling change that currently lives in the README
Buttons carry state in the accessible name only; none sets aria-pressed
Each slider puts role="slider" on .Control with the thumb aria-hidden — a deliberate deviation from the APG/Radix model, and exactly the kind of thing reported as a bug
A slider root needs a height, or the track measures zero and the slider is silently inert
Home / End are slider-scoped; the arrow keys and the media shortcuts are global to any focused control
data-part attributes as the styling hook
Which writes are clamped, and to what
Move, don't duplicate. A fact should end up in JSDoc or in the README prose, not both. Prefer JSDoc for contract; leave the README for narrative that reads front to back. Where you move something, note it so the README can be trimmed.

Prefer eliminating the need
Before writing a doc comment, check whether the fact can be encoded instead — a better parameter name, or a tighter type that makes the illegal state unrepresentable. Those are permanent; prose rots. Keep any such change minimal, behaviour-preserving, and call it out in the report.

Style
MDN tone: factual, direct, present tense, no storytelling
Lead with what the symbol is or does, in one sentence, then constraints
Shorter is better, but never drop the why to save a line
Match the file's existing conventions — dash style, backtick usage, reference format
Keep A4 / S9 / T1 style refs to REVIEW-FINDINGS.md intact; they point at reasoning instead of duplicating it
Report
Added — symbol, and the contract fact it now carries
Rewritten — before/after, one line on what the old one padded or omitted
Deleted — symbol, and which category of redundancy
Moved from README — what, and where it went, so the README can be trimmed
Encoded instead — anything that became a name or a type
Deliberately left bare — symbols where the name and signature genuinely suffice, so a reviewer can tell a considered skip from a missed file
Verify
npx tsc --noEmit --project tsconfig.app.json, npx eslint ., npx prettier --check ., npx vitest run — all green, behaviour unchanged. The react-refresh/only-export-components warning in testJSDom/testComponents.tsx is pre-existing and expected.

Also run npx tsup and inspect dist/index.d.ts: doc comments must survive into the declaration file, since that is what consumers' editors actually read. A comment that doesn't make it into .d.ts has done nothing.

Do not commit.
