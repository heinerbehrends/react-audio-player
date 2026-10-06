---
id: S33
title: "A seek glides to its target, and the thumb and fill disagree during playback"
epic: surface
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

Found building the demo's waveform example (D8, phase 3). The timeline's fill
transitions `transform` over 250ms (S32) to smooth the ~4 Hz `timeupdate`
steps. It does that for every change of value, so a seek glides too: a click
on the track, an arrow key, `<SeekButton>`, `seek()`, a chapter list, the lock
screen. A seek should jump; the glide is for playback only. Only a drag is
exempt today, through `data-state="dragging"`.

The thumb has no transition, so it jumps on a seek — right — but steps during
playback beside a gliding fill, up to 250ms apart. On a long track that is
under a pixel per step and invisible; on a short one, or with a full-height
playhead like the waveform's, it shows.

## Tried (2026-10-06), reverted

Giving the thumb the fill's transition, from the same `:where()` rule keyed on
`data-slider="timeline"`. It fixed the disagreement and made a click glide the
thumb as well, which is worse. It also broke `no-snap-back.spec.ts`, which
samples the thumb's drawn box: mid-glide the box is below the target, which
reads as a snap-back. Sampling the thumb's inline `transform` instead — the
display value — would keep that test meaningful with any transition.

## What a fix needs

A signal, available **in the same render** as the new value, that the change
is a seek rather than playback, for every seek source. Then the drag rule's
`transition-duration: 0s` can cover it, for fill and thumb alike.

- The element's `seeking` event covers every source, but fires a task after
  `currentTime` is set. The new value may already have rendered and started
  its transition by then, and changing the duration does not stop a running
  transition.
- `committed` in `useSlider` is synchronous, but covers only the slider's own
  drag and click.
- A store-level "seek dispatched" flag, set where every `SEEK`-like action is
  handled, would cover all sources synchronously. It would surface as a new
  root `data-state` value, which is API.
- Or by size: no transition when the value moves further than playback could
  in one `timeupdate`. No new state, but a heuristic, and a rate of 8× moves
  ~2 s per tick.

## Resolution

**Shipped** (2026-10-06): the default glide is gone, chosen over a seek
signal as the smaller change. The fill's `<style>` sets no transition, so fill
and thumb both jump — to each `timeupdate` step and to a seek's target alike —
and always agree. `Timeline.Progress` is `SliderProgress`, as on the other two
sliders; its wrapper only carried the transition.

The cost is stepping during playback, about four times a second: invisible on
a long track (the waveform's 4:43 moves under a pixel per step at 830px), a
couple of pixels on the playlist's 48 s excerpts at 420px. The README shows
the opt-in CSS for a glide and its drag exception, and says a seek will glide
with it; S32's `data-slider` and the zero-specificity fill are what make that
two plain rules. The waveform example dropped its transition.

**Verified by** — jsdom: the fill's rules contain no `transition`, and the
fill has none inline. The S32 E2E test for the transition's drag behaviour is
removed with the transition; `no-snap-back.spec.ts` is unchanged and still
samples the thumb's drawn box, which no longer glides.
