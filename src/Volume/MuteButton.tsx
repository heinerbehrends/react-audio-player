import { useCallback, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { handleMediaKeys } from "../handleKeys";

type MuteButtonComponentProps = {
  children: React.ReactNode;
};

export function MuteButtonComponent({ children }: MuteButtonComponentProps) {
  const { handlePlayerAction, isMuted, getPlayerState } =
    useContext(PlayerContext);
  const {
    volumeCallbackRef: { current: volumeCallback },
  } = useContext(AudioContext);
  const { volume } = getPlayerState();

  const handleClick = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_MUTE" });
    if (!volumeCallback?.handleVolumeAction) return;
    const nextVolume = isMuted ? volume : 0;
    volumeCallback.handleVolumeAction({
      type: "UPDATE_TIME",
      time: nextVolume,
    });
  }, [handlePlayerAction, isMuted, volume, volumeCallback]);

  return (
    <button
      aria-label="Mute"
      aria-pressed={isMuted}
      onKeyDown={(event) =>
        handleMediaKeys({ event, handlePlayerAction, getPlayerState })
      }
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

type MutedProps = {
  children: React.ReactNode;
};

function Muted({ children }: MutedProps) {
  const { volumeState } = useContext(PlayerContext);
  if (volumeState !== "muted") return null;
  return children;
}

type LowVolumeProps = {
  children: React.ReactNode;
};

function LowVolume({ children }: LowVolumeProps) {
  const { volumeState } = useContext(PlayerContext);
  if (volumeState !== "low") return null;
  return children;
}

type HighVolumeProps = {
  children: React.ReactNode;
};

function HighVolume({ children }: HighVolumeProps) {
  const { volumeState } = useContext(PlayerContext);
  if (volumeState !== "high") return null;
  return children;
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
