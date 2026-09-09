---
id: D3
title: "`volume` is inert on iOS, and nothing says so"
epic: features
status: open
severity: none
origin: demand
breaking: false
---

On iOS the audio level is
under the user's physical control by Apple's design: `HTMLMediaElement.volume`
is not settable from JavaScript and reading it always returns 1. `muted` still
works. So `writeVolume` assigns, the element ignores it, `syncFromElement` never
observes a change, the atom holds, and the thumb does not move. **The store is
behaving correctly and the user sees a dead slider** — which is the worst
combination available, because there is no bug to find.

Wanted: one derived signal, `useIsVolumeAvailable()` or similar, so a consumer
can drop `<Volume>` on iOS and keep `<MuteButton>`, which still works. The
detection is a capability probe rather than a UA test — assign a value other
than 1 and read it back — and a probe is a _write_, so it has to run once at
attach, before any consumer value is applied, and restore what it found. Ugly,
and still cheaper than the issue it prevents.

Media Chrome carries an open discussion titled "media-volume-range doesn't work
in iOS Safari"; react-h5-audio-player has "I can't control volume while using
audio player on iOS devices." This one gets filed.
