/**
 * Runs the consumer's handler, then the library's — unless the consumer called
 * `preventDefault()`, which is their opt-out.
 *
 * Spreading `{...props}` over a handler *replaces* it rather than adding to it,
 * and the failure is silent: `<Timeline.Seek onKeyDown={…}>` would drop
 * arrow-key adjustment and every media shortcut, leaving an element that still
 * renders and still announces a value but no longer responds. The types allow
 * it, since `onKeyDown` is a legitimate button prop.
 *
 * Consumer-first is the Radix convention, and it is what makes the opt-out
 * possible. The trade is that a `preventDefault()` called for an unrelated
 * reason — stopping a scroll, say — also cancels the library behaviour.
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
