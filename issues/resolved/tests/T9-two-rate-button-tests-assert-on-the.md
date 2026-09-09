---
id: T9
title: "Two rate-button tests assert on the mock, not the element"
epic: tests
status: resolved
severity: P2
origin: review
breaking: false
evidence: [measured]
---

`ChangePlaybackRate.test.tsx:64-70`, `SetPlaybackRate.test.tsx:65-71` verify wiring only —
they would pass if `handleMediaKeys` did nothing. The module-level `vi.spyOn` in `beforeEach`
also disables the real hook for _every_ test in those files. Neighbouring files
(`PlayButton.test.tsx:66-78`) do it correctly against the fake.

## Resolution

**Shipped** — Both rate-button keyboard rows assert on the element rather than on a mock of `useHandleMediaKeys`, and the module-level `vi.spyOn` that disabled the real hook for _every_ test in those two files is gone. Each row presses `p` (expecting `play`) and `>` (expecting a 0.05 rate step — deliberately not the button's own `amount`)

**Verified by** —
