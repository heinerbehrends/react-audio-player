---
id: A15
title: "Every string is hardcoded English"
epic: accessibility
status: open
severity: P2
origin: review
breaking: false
evidence: [code-reading]
---

Most `aria-label`s can be overridden via
props, but `aria-valuetext` is value-dependent (so a static prop cannot replace it) and
`ErrorMessage` accepts no props at all.

## Where it stands

Every string is hardcoded English, and there is no way to supply your own. **Needs design before implementation — this row is a problem statement, not a plan.** (1) **Entries must be functions, not strings.** `aria-valuetext` renders "Position 1:30 of 3:00" and "Muted, 80%", and `PlayButton` has four state-dependent names — a static `aria-label` flattens all four to one string, which is a broken translation rather than a worse one. The controls needing this are exactly the three **A4** toggles plus the sliders: A4 put state on the name, and that is what makes a string bag insufficient. (2) **Three number formats, not one** — `formatTime`, `` `${Math.round(v * 100)}%` `` and `` `${Math.round(v * 100) / 100}x` ``. Two of them sit _inside_ larger strings ("Muted, 80%"), so labels and number formatting cannot be separate options; one mechanism passing raw values, with `Intl` left to the consumer. This also settles the open half of **S16**: time formatting is an entry in the surface, not a `format` prop on `Time.Elapsed`. (3) **Reach is already complete** — every English string is overridable per instance _except_ `aria-label="audio player"`, where `{...props}` is spread before the attribute (`AudioElement.tsx:65-67`), unreachable through `audioProps`. That is a one-line fix independent of this. So the surface buys ergonomics and the state-dependent cases, not reach. (4) Where it lives — one prop on `AudioPlayer` with per-component override. Before committing, write the German values for `PlayButton`'s four states, "Muted, 80%" and `1,5x`: those three exercise function-shaped entries, a number inside a sentence, and the decimal separator.
