---
id: F11
title: "No persistence"
epic: features
status: rejected
severity: P3
origin: review
breaking: false
---

of volume, rate or position. Strongest argument for doing F1 first —
with a hook, consumers build this in ten lines and it need never be a library feature.

## Where it stands

No persistence of volume, rate or position. Deliberately left out: with the hooks from **F1** shipped, a consumer builds this in ten lines, and a library that owns storage has to own the key naming and the SSR story too.

## Decision

**Not in the library** (2026-10-06). Saving volume, rate or position is a few
lines with the hooks that exist, and a library that owns storage would have to
own the key names, the storage choice and the server-rendering story too. It
belongs on the list of deliberate exclusions (D9).
