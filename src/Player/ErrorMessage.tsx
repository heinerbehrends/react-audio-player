import { forwardRef } from "react";
import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ErrorMessageProps = {
  /**
   * The message, as visible text. It is the live region's content, so do not
   * replace it with an `aria-label`, which would not be announced.
   */
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders `children` in a `<div role="alert">` while the track has failed to
 * load, and nothing otherwise. Media errors only: a refused `play()` does not
 * show it. For both kinds, use `useAudioError()`. Carries `data-part="error"`.
 */
export const ErrorMessage = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  ErrorMessageProps
>(function ErrorMessage({ children, ...props }, ref) {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  if (loadState === "error") {
    return (
      <div
        data-part="error"
        {...props}
        ref={ref}
        // After the spread: the role and the politeness are the component.
        role="alert"
        aria-live="assertive"
      >
        {children}
      </div>
    );
  }
  return null;
});
