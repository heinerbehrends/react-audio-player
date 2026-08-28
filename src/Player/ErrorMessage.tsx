import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ErrorMessageProps = {
  /**
   * The message. It becomes the live region's content, so it has to be visible
   * text — an `aria-label` would replace the announced name instead of adding
   * to it, which is why this component takes no other props.
   */
  children: React.ReactNode;
};

/**
 * Renders `children` in an assertive live region while the resource is unusable,
 * and nothing otherwise.
 *
 * **Media errors only**: a failed load, an unsupported codec, a decode failure.
 * A refused `play()` does not render it — the resource is fine and only a user
 * gesture will help. For both kinds, use `useAudioError()`.
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
