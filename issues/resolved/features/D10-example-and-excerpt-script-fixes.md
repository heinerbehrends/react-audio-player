---
id: D10
title: "The examples lose focus and reach, and the excerpt script cuts into tags"
epic: features
status: resolved
severity: P3
origin: backlog
breaking: false
evidence: [verified]
---

Found in the 2026-10-05 review of the demo examples (D8) and the script that
cuts their audio.

- **The basic example's hover bridge covers the mute button.** The volume
  slider's `::before` reaches 8px left of it to keep the slider open while the
  pointer crosses the gap, but the open slider's left margin is 4px. The
  pseudo-element is positioned within the slider root and paints above the
  button, so clicks on the button's rightmost 4px do nothing.
- **The basic example's volume slider is unreachable without hover.** It opens
  on `:hover` and `:focus-within` only, and until then is zero wide and takes
  no pointer events. Touch has no hover, so on a tablet, or a touch laptop, the
  slider cannot be dragged open; only the 400px container query, which drops it
  for phones, was meant to remove it. Not deliberate.
- **The playlist example drops focus at either end.** Previous and Next become
  `disabled` on reaching the first or last chapter, while focused; a disabled
  button loses focus, which falls to `<body>`, and the keyboard user starts
  over from the top of the page.
- **The basic-player spec reads the closed slider's width once.**
  `expect(await volumeWidth(example)).toBe(0)` does not retry, so it races the
  page settling.
- **`cut-excerpts.mjs` can copy tag bytes into an excerpt.** After the last
  MPEG frame the parser scans on byte by byte to the end of the file, and the
  "end of the last frame" marker lands there. With an ID3v1 tag (`TAG` and 125
  bytes) that is inside the tag, and a cut to the end of a chapter carries it.
  Separately, an unknown group name is skipped silently and the script exits 0.

## Resolution

**Shipped** (2026-10-05).

- The slider's left margin and its bridge share one `--gap` custom property,
  so the bridge ends where the button does. **Superseded the same day:** the
  hover moved to a `.basic-volume` wrapper around the button and the slider,
  which needs no bridge. Opening moved the button left, so a pointer above the
  20px slider hovered nothing, the slider closed, and the button slid back
  under it: a flicker. The wrapper is the button's height and its right edge
  holds still. Verified by `stays open with the pointer near the mute
button's top edge` in `testE2E/demo/examples.spec.ts`, which fails on the
  old rule.
- Under `@media (hover: none)` the basic example's volume slider stays open at
  every width; the hover reveal stays for a mouse. A screen reader focuses the
  slider before operating it, which opens it too. Phone widths still drop it
  for the hardware buttons.
- Previous and Next use `aria-disabled` instead of `disabled`, with handlers
  that do nothing at either end, and the disabled style keys on the attribute.
- The spec polls the closed width, and gains two tests: Previous keeps focus on
  reaching the first chapter, and with touch emulation the slider is open
  without hover.
- The parser stops at the audio's end — before an ID3v1 tag, and an APE tag
  before that — and also at a truncated last frame; the end marker is the end
  of the last whole frame. An unknown group name prints the known ones and
  exits 1, before Chromium launches.

**Verified by** — the demo and node `tsc` projects and a type-check of the
spec; the parser run on `alice-01.mp3` bare, with an ID3v1 tag and with an APE
tag before it, ending at the same byte (401,032) each time; the script with an
unknown group, exit 1. The demo E2E specs were not run in this change.
