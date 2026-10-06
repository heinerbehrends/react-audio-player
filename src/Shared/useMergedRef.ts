import { useCallback, type Ref } from "react";

function assign<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
}

/**
 * One ref callback for a part that needs its element and forwards it too.
 * Stable while both refs are, so React does not detach and re-attach it on
 * every render.
 */
export function useMergedRef<T>(own: Ref<T>, forwarded: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      assign(own, node);
      assign(forwarded, node);
    },
    [own, forwarded],
  );
}
