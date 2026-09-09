---
id: F11
title: "No persistence"
epic: features
status: open
severity: P3
origin: review
breaking: false
---

of volume, rate or position. Strongest argument for doing F1 first —
with a hook, consumers build this in ten lines and it need never be a library feature.

## Where it stands

No persistence of volume, rate or position. Deliberately left out: with the hooks from **F1** shipped, a consumer builds this in ten lines, and a library that owns storage has to own the key naming and the SSR story too.
