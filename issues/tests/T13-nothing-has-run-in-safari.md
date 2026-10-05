---
id: T13
title: "Nothing has run in Safari"
epic: tests
status: open
severity: P2
origin: backlog
breaking: false
---

Every measurement behind the library's browser-specific behaviour was taken in
Chromium and Firefox. WebKit is not installed on the dev machine:
`~/bin/pw-install-browsers.mjs` handles only Chromium, and `npx playwright
install` hangs there. The Playwright config has no `webkit` project.

## Checklist

Run these in real Safari, macOS and iOS where it differs. Note the result in
each ticket.

### Measured in other engines, so the fix assumes them

- [ ] **C14** — is playback audible at 0.125x and 8x? Where does Safari cut
      the sound, if anywhere? Does it throw outside a range, like Chromium?
- [ ] **G2** — which `playbackRate` values does Safari accept, and does it throw
      or clamp outside them?
- [ ] **F13** — does a `src` swap fire `pause`? Does a pending `play()` reject
      with `AbortError`? Does a playlist carry on across a swap?
- [ ] **B4** — does a paused seek to the end fire `ended`, as Firefox does?
- [ ] **D3** — is `volume` still inert on iOS, and does the volume slider
      disable itself there?
- [ ] **S25** / **S26** — do sizing a `<Timeline>` root with a class and hiding
      a slider with `hidden` work as measured?
- [ ] **S20** — do the `--progress` and `--offset` custom properties update
      during a drag?
- [ ] **F6** — `<MediaSession>`: lock screen metadata, play/pause, skip and the
      scrubber, on macOS and iOS.
- [ ] **A1** / **A2** / **A7** — Space on buttons, the modifier-key guard with
      VoiceOver on, and focus surviving a load-state change.

### Open tickets with browser behaviour in them

- [ ] **B8** — codec fallback: which formats does Safari play without `<source>`?
- [ ] **B9** — buffered ranges as Safari reports them.
- [ ] **D7** — HLS plays natively in Safari, so the recipe differs there.
- [ ] **F10** — keyboard shortcuts with Safari's focus rules. Safari does not
      focus buttons on click by default.
- [ ] **P1-b** / **P2-a** — drag cost and compositing, traced in Safari.

The other open tickets (B1, B2, B6, B10, C12, D2, D5, D6, D8, D9, F11, T12) are
API, docs or tooling, with nothing to measure in a browser.

## What would close it

The checklist above, done once. Better still, a `webkit` project in
`playwright.config.ts`, once WebKit can be installed on the dev machine or runs
in CI.
