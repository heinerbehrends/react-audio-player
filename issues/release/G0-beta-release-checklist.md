---
id: G0
title: "Beta release checklist"
epic: release
status: open
severity: P0
origin: assessment
breaking: false
---

The gate for `0.1.0-beta.0`, from the pre-beta assessment of 2026-10-01. The
verdict was **ship, after about a day of small fixes**: every quality gate was
green on the current tree (type-check, lint, prettier, build, `attw`, 654 jsdom
tests, 124 E2E tests on Chromium and Firefox, all 38 exports documented in
`dist/index.d.ts`, a clean 7-file tarball), and what is not ready is the
packaging, the README's claims about itself, and one crash path.

This ticket holds the list; the findings themselves are their own tickets so
each can close with its fix. It closes when every row below is either resolved
or explicitly deferred past the beta.

## Fix before the beta

- [ ] **G1** — version, `prepublishOnly`, a `beta` dist-tag and a CHANGELOG
- [ ] **G2** — the playback-rate write throws in Chromium below 0.0625
- [ ] **G3** — four README sentences the code contradicts
- [ ] **S14** — a dev-only warning for the slider that measures zero: `.Control`
      omitted, `.Thumb` nested inside it, or a root with no height. All three
      fail silently today and are what a beta user hits first
- [ ] **C13** — delete the dead `AUDIO_FILE_ENDED` action
- [ ] **D3**, **B4**, **B1** — document, do not fix: `volume` is inert on iOS,
      Firefox fires `ended` on a paused seek to the end, and a playlist advance
      arrives paused. Each is one README paragraph the ticket already contains

## Decide before the beta, because they are breaking later

- [ ] **A10** — the missing wrapper. Adding an element later breaks every
      consumer's layout. Recommendation: keep no wrapper, document
      `role="region"` plus a name on the consumer's container
- [ ] **D2** — refs on the parts. No part forwards a `ref`; focus management on
      the play button is a day-one need. Additive, but every prop type moves
- [ ] **F6** — Media Session. The largest missing feature for an audio library.
      Additive, since `AudioFile` already reserves the metadata fields, so it can
      land in a later beta — say so in the README
- [ ] **B8** — codec fallback. Widening `AudioFile` to a union is additive for
      everyone passing `{ src }`, so it does not block. Confirm the shape

## Safe to leave open

**B2**, **B9**, **D4**'s `isLive` signal (its README paragraph is in **G3**),
**D5**–**D9**, **F10**, **F11**, **S20**, **P1-b**, **P2-a**, **T12**,
**C12**, **B6**, **B10** (verified green by hand, see the ticket) and **A16**.
Each ticket the assessment reached a verdict on carries that verdict in its own
"Beta assessment" section, so the answer is readable from the ticket and not
only from here.

## Spec pass

Checked against the W3C specs rather than assumed:

- `role="slider"` on a `<button>` is explicitly permitted by ARIA in HTML, so
  the `.Control` element stands.
- `aria-disabled` over `disabled`, name-as-state on the toggles, `aria-pressed`
  on the rate presets inside `role="group"`, Home/End on sliders only, Space
  unbound: all defensible. A `radiogroup` would be the stricter pattern for
  mutually exclusive rates, but it breaks a `.Set` used alone. Keep.
- No test pins behaviour that should be different. The ended spec pins browser
  behaviour, and says so.
- The two places the written spec and the code disagree are the README
  `onEnded` row and the rate-range comment — **G3** and **G2**.
