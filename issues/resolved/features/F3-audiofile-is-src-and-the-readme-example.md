---
id: F3
title: "`AudioFile` is `{src}` and the README example does not compile"
epic: features
status: resolved
severity: P0
origin: review
breaking: false
evidence: [verified]
---

**Confirmed by
running `tsc`:**

```
error TS2353: Object literal may only specify known properties,
and 'type' does not exist in type 'AudioFile'.
```

`README.md:65` shows `{ src: "audio.mp3", type: "audio/mpeg" }`. **This is the second false
README claim of the same class as the captions one** — copy-pasting the documented
`<AudioPlayer>` example fails to build. Consequences: no codec fallback, and no Media
Session metadata (`title`, `artist`, `artwork`).

## Resolution

**Shipped** — `title`/`artist`/`album`/`artwork` on `AudioFile`; README example now compiles

**Verified by** — `tsc` — the old example was a hard `TS2353`
