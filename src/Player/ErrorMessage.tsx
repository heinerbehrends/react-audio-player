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
      <div
        role="alert"
        aria-live="assertive"
        aria-label="There was an error loading the audio"
        className="audio-player-error"
      >
        <div aria-hidden="true">{children}</div>
      </div>
    );
  }
  return null;
}
