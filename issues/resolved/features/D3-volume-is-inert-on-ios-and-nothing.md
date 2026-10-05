---
id: D3
title: "`volume` is inert on iOS, and nothing says so"
epic: features
status: resolved
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

## Beta assessment (2026-10-01)

**Document before the beta, fix after.** The paragraph above is the README
text; the capability probe can wait. Tracked from **G0** and **G3**.

**README paragraph shipped** (2026-10-01, with G3) under Volume. The
capability probe stays open.

## Resolution

**Shipped** (2026-10-05) — `useIsVolumeAvailable()`, exported, plus
`<Volume.Control>` rendering `aria-disabled` where the probe says no. The
probe is not the one proposed above: instead of writing to the player's own
element at attach and restoring, it assigns a volume to a detached `<audio>`
once per page and reads it back, as Plyr does — nothing is written to the real
element and no `volumechange` fires. The hook is `useSyncExternalStore` with a
server snapshot of `true`, so hiding `<Volume>` on it hydrates cleanly. It is
the one hook that works outside `<AudioPlayer>`, and the root's JSDoc says so.

**Verified by** — `testJSDom/store/volumeAvailable.test.tsx` (true by default,
false with the prototype setter stubbed to ignore writes, probed once) and two
rows in `SliderControl.test.tsx` (the volume control is disabled under the
stub, the timeline is not). Playwright's WebKit is desktop WebKit, where volume
is writable, so the real behaviour still wants one look on an iPhone.
