---
id: C12
title: "The committed-value reset needs an effect and a lint suppression"
epic: architecture
status: open
severity: P3
origin: backlog
breaking: false
---

`useSlider.ts` clears the retained post-commit value from an effect, with an
inline `react-hooks/set-state-in-effect` suppression:

```ts
useEffect(() => {
  if (committed && committed.storeValue !== valueFromStore) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCommitted(null);
  }
}, [committed, valueFromStore]);
```

The entry is load-bearing, not housekeeping: left in place, it matches again
whenever the store returns to the value the commit was made against and
re-applies the old value. `testJSDom/Slider/useSlider.test.tsx` pins that.

The lint rule wants the reset out of the effect, but React's documented
render-phase alternative — comparing against previous state during render and
calling `setState` there — does not take effect here, and the test fails. So the
effect stays and the rule is suppressed at the one line.

## Where it stands

The suppression is deliberate and pinned by a test, so nothing is broken. What is
missing is the reason the render-phase form fails, which is not understood — only
observed. Worth revisiting when React 19's behaviour here is better understood,
or when the retain-until-changed rule is next touched; the snap-back it prevents
is **T1** and the echo gap it exists for is **C3**.

Not a correctness risk on its own: if the reset regressed, the pinned test fails.
