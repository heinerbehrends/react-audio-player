import { useContext } from "react";
import { PlayerContext } from "./PlayerContext";

interface ErrorProps {
  children: React.ReactNode;
}

export function Error({ children }: ErrorProps) {
  const { playerState: player } = useContext(PlayerContext);
  if (player === "error") {
    return (
      <div role="alert" aria-live="assertive" className="audio-player-error">
        <div aria-hidden="true">{children}</div>
        <span className="sr-only">There was an error loading the audio</span>
      </div>
    );
  }
  return null;
}
