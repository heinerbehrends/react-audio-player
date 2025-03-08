import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

type MuteButtonComponentProps = {
  children: React.ReactNode;
};

export function MuteButtonComponent({ children }: MuteButtonComponentProps) {
  const { dispatch } = useContext(PlayerContext);
  return (
    <button onClick={() => dispatch({ type: "TOGGLE_MUTE" })}>
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

const MuteButton = MuteButtonComponent as MuteButtonComponent;

MuteButton.Muted = Muted;
MuteButton.NotMuted = NotMuted;

export default MuteButton;
