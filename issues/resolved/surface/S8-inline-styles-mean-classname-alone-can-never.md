---
id: S8
title: "Inline styles mean `className` alone can never size anything"
epic: surface
status: resolved
severity: P1
origin: review
breaking: true
evidence: [code-reading]
---

Inline `style` beats any author-stylesheet selector regardless of specificity. Locked
properties by element:

| Element                               | Inline properties locked                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Timeline` root                       | `display, grid-template-*, width, height, position`                                              |
| `Volume` / `PlaybackRateSlider` roots | `display, grid-template-*, width`                                                                |
| `.Progress`                           | `grid-column, grid-row, width, height, transform, transform-origin` (+ `transition` on Timeline) |
| `.Seek` / `.Set`                      | the above **plus** `border, background, padding`                                                 |
| `.Drag`                               | `position, grid-column, grid-row, cursor, transform, touch-action`                               |

Tailwind `h-2 w-1/2 rounded-full bg-blue-500` on `Timeline.Progress` applies only the last
two. Tell: the demo (`App.tsx:52-140`) styles entirely with `style={{}}` and never once with
`className` — the library is only usable the way its author uses it.
Proposed split: keep _structural_ inline (`transform`, `grid-column/row: 1/1`,
`position: absolute` on Drag, `touch-action: none`); move _opinion_ out
(`width/height: 100%`, `border/background/padding` resets, `cursor: grab`, the new
`transition`) into an optional stylesheet with low-specificity selectors.

## Resolution

**Shipped** — Opinion moved to an optional `styles.css`, exported as `react-headless-audio-player/styles.css`; roots gained `data-part="root"` for the selector. Verified in Chrome: the four defaults apply, and one plain consumer class with no `!important` overrides every one. The demo's own inline `border: none`/`background: none` workarounds were deleted and it renders identically

**Verified by** —
