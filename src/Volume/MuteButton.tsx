import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
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

type LowVolumeProps = {
  children: React.ReactNode;
};

function LowVolume({ children }: LowVolumeProps) {
  const { isMuted } = useContext(PlayerContext);
  const { audioElement } = useContext(AudioContext);
  if (isMuted) return null;
  if (!audioElement) return null;
  if (audioElement.volume < 0.5) return children;
  return null;
}

type HighVolumeProps = {
  children: React.ReactNode;
};

function HighVolume({ children }: HighVolumeProps) {
  const { isMuted } = useContext(PlayerContext);
  const { audioElement } = useContext(AudioContext);
  if (isMuted) return null;
  if (!audioElement) return null;
  if (audioElement.volume >= 0.5) return children;
  return null;
}

type MuteButtonComponent = React.FC<MuteButtonComponentProps> & {
  Muted: React.FC<MutedProps>;
  LowVolume: React.FC<LowVolumeProps>;
  HighVolume: React.FC<HighVolumeProps>;
};

MuteButtonComponent.Muted = Muted;
MuteButtonComponent.LowVolume = LowVolume;
MuteButtonComponent.HighVolume = HighVolume;
export const MuteButton = MuteButtonComponent;
