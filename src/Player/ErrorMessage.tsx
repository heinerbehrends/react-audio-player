import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

type ErrorMessageProps = {
  children: React.ReactNode;
};

export function ErrorMessage({ children }: ErrorMessageProps) {
  const store = usePlayerStore();
  const loadState = useStore(store.loadState);

  if (loadState === "error") {
    return (
      // A live region is announced from its content, so the children must not
      // be hidden and the region must not carry an `aria-label` — a label
      // replaces the accessible name without being reliably announced on
      // insertion, which left the consumer's message unread.
      <div role="alert" aria-live="assertive" className="audio-player-error">
        {children}
      </div>
    );
  }
  return null;
}
