import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ErrorMessageProps = {
  /**
   * The message. Rendered as the live region's own content, so it must be
   * visible text — this component takes no other props, and adding an
   * `aria-label` to the region would replace the name without being reliably
   * announced.
   */
  children: React.ReactNode;
};

/**
 * Renders `children` in an assertive live region while the resource is
 * unusable, and nothing otherwise.
 *
 * **Media errors only** — a failed load, an unsupported codec, a decode failure.
 * A refused `play()` does not render this: the resource is fine and the browser
 * declined the command, so there is nothing to recover from but a user gesture.
 * For both kinds, and the reason, use `useAudioError()`.
 */
export function ErrorMessage({ children }: ErrorMessageProps) {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  if (loadState === "error") {
    return (
      // A live region is announced from its content, so the children must stay
      // visible and the region must carry no `aria-label`: a label replaces the
      // accessible name without being reliably announced on insertion, which
      // leaves the consumer's message unread.
      <div role="alert" aria-live="assertive" className="audio-player-error">
        {children}
      </div>
    );
  }
  return null;
}
