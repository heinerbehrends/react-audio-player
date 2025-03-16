import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { handleMediaKeys } from "../TimelineVolume/handleKeys";

type MuteButtonComponentProps = {
  children: React.ReactNode;
};

export function MuteButtonComponent({ children }: MuteButtonComponentProps) {
  const { handlePlayerAction, isMuted } = useContext(PlayerContext);
  return (
    <button
      aria-label="Mute"
      aria-pressed={isMuted}
      onKeyDown={(event) => handleMediaKeys({ event, handlePlayerAction })}
      onClick={() => handlePlayerAction({ type: "TOGGLE_MUTE" })}
    >
      {children}
    </button>
  );
}

type MutedProps = {
  children: React.ReactNode;
};

function Muted({ children }: MutedProps) {
  const { isMuted } = useContext(PlayerContext);
  if (!isMuted) return null;
  return children;
}

type NotMutedProps = {
  children: React.ReactNode;
};

function NotMuted({ children }: NotMutedProps) {
  const { isMuted } = useContext(PlayerContext);
  if (isMuted) return null;
  return children;
}

type MuteButtonComponent = React.FC<MuteButtonComponentProps> & {
  Muted: React.FC<MutedProps>;
  NotMuted: React.FC<NotMutedProps>;
};

MuteButtonComponent.Muted = Muted;
MuteButtonComponent.NotMuted = NotMuted;

export const MuteButton = MuteButtonComponent;
