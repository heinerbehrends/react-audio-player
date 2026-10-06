---
id: S35
title: "`usePlayerRootProps()` returns a 270-line inferred type"
epic: surface
status: open
severity: P3
origin: backlog
breaking: false
evidence: [measured]
---

Found during G5. `usePlayerRootProps` has no declared return type, so tsup
emits the inferred one: the spread of `React.HTMLAttributes<HTMLElement>`
written out member by member. Measured on 2026-10-06 in `dist/index.d.ts`, the
declaration runs from line 606 to line 874, one line per attribute from
`defaultChecked` to `onTransitionEndCapture`, with the four props the hook
actually adds (`data-part`, `role`, `aria-label`, `tabIndex`, plus the composed
`onKeyDown`) buried among them. A hover on the hook shows that wall, and the
generic `P` is lost: the result does not keep the caller's own keys the way
`ButtonPropsBag<P>` does for the six button hooks.

## Fix

Declare the return type the way the button hooks do:

```ts
type PlayerRootBag<P> = Omit<P, keyof PlayerRootBase> & PlayerRootBase;
type PlayerRootBase = {
  readonly "data-part": "player";
  readonly role: "region";
  readonly "aria-label": string;
  readonly tabIndex: number;
  readonly onKeyDown: React.KeyboardEventHandler<HTMLElement>;
};
```

with a one-sentence doc comment on each member, and cast the returned object as
`usePlayButtonProps` does. The `.d.ts` then shrinks by about 260 lines and the
hover reads like the other hooks'.

## Done when

- `dist/index.d.ts` declares `usePlayerRootProps` against a named bag type, and
  no `HTMLAttributes` member is spelled out in the file.
- `pnpm check-docs` still passes, and the bag's members each carry a comment.
- The podcast example, which spreads the hook onto a `<section>`, still
  type-checks.
