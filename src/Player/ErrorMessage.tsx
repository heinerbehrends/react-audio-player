import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ErrorMessageProps = {
  /**
   * The message. It becomes the live region's content, so it has to be visible
   * text. Do not pass an `aria-label`: a name replaces the content rather than
   * adding to it, and is not reliably announced on insertion, so the message
   * would go unread (A3).
   */
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders `children` in an assertive live region while the resource is unusable,
 * and nothing otherwise.
 *
 * **Media errors only**: a failed load, an unsupported codec, a decode failure.
 * A refused `play()` does not render it — the resource is fine and only a user
 * gesture will help. For both kinds, use `useAudioError()`.
 *
 * Style it through `className`, `style`, or `[data-part="error"]`. It adds no
 * class of its own.
 */
export function ErrorMessage({ children, ...props }: ErrorMessageProps) {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  if (loadState === "error") {
    return (
      <div
        data-part="error"
        {...props}
        // After the spread: the role and the politeness are the component.
        role="alert"
        aria-live="assertive"
      >
        {children}
      </div>
    );
  }
  return null;
}
