import { usePlayerContext } from "./PlayerContext";

type ErrorMessageProps = {
  children: React.ReactNode;
};

export function ErrorMessage({ children }: ErrorMessageProps) {
  const { playerState: player } = usePlayerContext();
  if (player === "error") {
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
