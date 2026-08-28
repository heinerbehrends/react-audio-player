/**
 * Calls `theirs`, then `ours` — unless `theirs` called `preventDefault()`.
 *
 * A spread prop replaces a handler rather than adding to it, and does so
 * silently: `<Timeline.Control onKeyDown={…}>` would drop arrow-key adjustment and
 * every media shortcut, leaving an element that still renders and announces a
 * value but no longer responds.
 *
 * Consumer-first ordering is what makes `preventDefault()` an opt-out. The cost
 * is that one called for an unrelated reason cancels `ours` too.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
): (event: E) => void {
  return (event) => {
    theirs?.(event);
    if (!event.defaultPrevented) {
      ours(event);
    }
  };
}
