---
id: A17
title: "The time toggle's name hides the time it shows"
epic: accessibility
status: resolved
severity: P2
origin: backlog
breaking: true
evidence: [code-reading]
---

`Time.Toggle` showed "1:23" but was named "Show time remaining". The
`aria-label` replaced the button's content as its accessible name, so the
visible text was not part of the name (WCAG 2.5.3 Label in Name, level A):

- a voice-control user saying "click 1:23" reached nothing
- a screen reader announced the action and never the time

Since bb31931 the toggle renders its own readout, so it is the only switching
readout there is.

## Options weighed

- **Keep the action name.** Fails 2.5.3.
- **The content as the name, the action in `aria-description`.** Passes, but
  `aria-description` is ARIA 1.3 and some screen readers skip it, which loses
  what pressing does.
- **An `aria-label` that starts with the visible text.** Passes, works
  everywhere, and keeps A4's rule that the name says what pressing does.

## Resolution

**Shipped** (2026-10-05) — the third option. The name is the readout's text,
which readout it is, then the action: "1:23 elapsed, show time remaining",
"-2:37 remaining, show time elapsed". Screen readers do not announce a name
change on an unfocused control, so the per-second change is silent.

`useReadoutText` in `src/TimeDisplay/TimeDisplay.tsx` produces the text for
`Time.Elapsed`, `Time.Remaining` and the toggle's name, so the name always
matches what is shown, `labels.time` included.

**Breaking:** `labels.timeToggle` was `Record<TimeDisplayState, string>`. It is
now `({ time, shown }) => string`, where `time` is the readout's text as shown.

**Verified by** — `is named by the time shown, then what it will do, while
showing %s` in `testJSDom/TimeDisplay/Time.test.tsx`; `labels.timeToggle`
rows and `hands the entry the readout labels.time renders` in
`testJSDom/labels/buttonLabels.test.tsx`; the toggle's name in
`testE2E/TimeDisplay/time-display.spec.ts`, Chromium and Firefox.
