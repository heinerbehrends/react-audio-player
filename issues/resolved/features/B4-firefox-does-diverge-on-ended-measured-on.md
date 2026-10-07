---
id: B4
title: "Firefox **does** diverge on `ended`, measured on a bare element with no pointer simulation"
epic: features
status: resolved
severity: none
origin: backlog
breaking: false
evidence: [measured]
---

a paused seek to `duration` sets `el.ended` and fires the event, where Chrome does neither. So a drag to the end of the timeline calls a consumer's `onEnded` — advancing their playlist — in Firefox only. `useIsAtEnd` is unaffected, being derived from position, which both browsers agree on. **Still undecided**: whether to paper over the divergence or document it. Now testable on both engines, so whichever is chosen can be pinned.

## Beta assessment (2026-10-01)

**Document before the beta, decide after.** One README sentence next to the
`onEnded` prop: in Firefox a drag to the end of the timeline fires it. Whether
to paper over the divergence stays open. Tracked from **G0** and **G3**.

**Documented** (2026-10-01, with G3) in the `onEnded` row and the Playlists
section. Whether to paper over the divergence stays open.

## Resolution

**Decided** (2026-10-07): document, do not paper over.

Suppressing the event would mean telling a paused seek that lands on
`duration` apart from a track that played there, and the store has no seek
signal to do that with — the same gap that ruled out a default transition on
the fill (S33). A guess would drop real `ended` events on a `src` whose
`duration` the browser rounds, and a playlist that fails to advance is worse
than one that advances a drag early. The divergence is Firefox's, and it is
small: it takes a drag to the very end while paused.

Where it lives now, after the README rewrite (G4) moved it out of the README:

- the `onEnded` JSDoc in `AudioPlayer.tsx`, which every editor shows at the
  prop: "Firefox also fires it when a paused seek lands on the end; Chrome
  does not";
- `docs/recipes/playlist.md`, where the consequence is concrete: the list
  advances;
- the Firefox project's comment in `playwright.config.ts`, which names the
  divergence as the reason the suite runs both engines.

**Verified by** — the `ended` specs run in both projects, so a change in either
engine's behaviour shows up as a Firefox-only or Chromium-only failure rather
than silently; `pnpm issues:check` and `prettier --check` clean.
