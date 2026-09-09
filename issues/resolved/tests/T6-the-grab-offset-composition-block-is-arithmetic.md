---
id: T6
title: 'The "grab-offset composition" block is arithmetic, not a test'
epic: tests
status: resolved
severity: P1
origin: review
breaking: false
evidence: [measured]
---

`sharedFunctions.test.tsx:243-300` performs the subtraction under test _in the test_, on two
numbers it derived from the same variable: `(60 + g) − g === 60` by construction. No
production path decides anything. Its docstring claims it pins an invariant it does not pin.
The real coverage is elsewhere and is good.

## Resolution

**Shipped** — The arithmetic block is deleted rather than repaired, which was the finding's own verdict. The invariant it claimed to pin is pinned for real one layer up, in `useSlider.test.tsx`: five rows drive `onThumbPointerDown` against a stubbed thumb rect, where the subtraction is production's to make

**Verified by** —
