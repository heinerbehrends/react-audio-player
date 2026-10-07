---
id: G6
title: "The README has no badges"
epic: release
status: open
severity: P3
origin: backlog
breaking: false
---

Every comparable library's README opens with a badge row: npm version,
license, CI, and for the small ones a bundle size. Ark UI, Vidstack, use-sound,
react-h5-audio-player and media-chrome all have one; only Radix, whose docs
site carries everything, does not. A reader on npm or GitHub reads the row
before the first sentence, so a README without one looks unmaintained or
unpublished next to its peers.

The README rewrite (G4) left them out on purpose. The npm badges resolve
against the registry, so until the first `pnpm publish --tag beta` (G1) they
render as "not found", which is worse than nothing.

## After the first publish

Add a badge row under the title, above the first paragraph:

| Badge                             | Source                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| npm version, under the `beta` tag | `https://img.shields.io/npm/v/react-headless-audio-player/beta`                             |
| License                           | `https://img.shields.io/npm/l/react-headless-audio-player`                                  |
| CI                                | `https://github.com/heinerbehrends/react-audio-player/actions/workflows/test.yml/badge.svg` |
| Bundle size, gzipped ESM          | `https://img.shields.io/bundlejs/size/react-headless-audio-player`                          |

Each badge links somewhere useful: the npm page, `LICENSE`, the workflow runs,
and the bundlejs page for the package.

The version badge must name the `beta` tag. Without it shields.io reads
`latest`, which G1 leaves unset until 1.0, and the badge shows "not found" on
a published package.

The size badge is optional. `pnpm size` already measures the bundle locally,
so the badge only matters if the number is a selling point; check it against
that script's output before adding it, and drop it if the two disagree.

## Done when

- The row renders on both GitHub and npm with no "not found" badge.
- Each badge links to its target.
- `pnpm format:check` passes; Prettier leaves a line of image links alone, but
  the row must not break the heading's anchor in the contents list.
