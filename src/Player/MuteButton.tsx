import { useCallback, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { useHandleMediaKeys } from "../handleKeys";
import { useIsDisabled } from "../hooks";
import { areNumbersClose } from "../functionsLib";

type MuteButtonComponentProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function MuteButtonComponent({
  children,
  ...props
}: MuteButtonComponentProps) {
  const { isMuted } = useContext(PlayerContext);
  const toggleMute = useToggleMute();
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      aria-label="Mute"
      aria-pressed={isMuted}
      onKeyDown={handleMediaKeys}
      onClick={toggleMute}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

type MutedProps = {
  children: React.ReactNode;
};

function useToggleMute() {
  const { getPlayerState, handlePlayerAction, isMuted } =
    useContext(PlayerContext);
  const {
    volumeCallbackRef: { current: volumeCallback },
  } = useContext(AudioContext);
  const { volume, unmuteVolumeRef } = getPlayerState();

  return useCallback(() => {
    const newVolume = areNumbersClose(volume, 0)
      ? unmuteVolumeRef.current
      : volume;
    console.log("TOGGLE_MUTE newVolume", newVolume);
    handlePlayerAction({ type: "TOGGLE_MUTE", unmuteVolume: newVolume });
    if (!volumeCallback?.handleVolumeAction) return;
    const nextVolume = isMuted ? volume : 0;
    volumeCallback.handleVolumeAction({
      type: "UPDATE_UI_VALUE",
      value: nextVolume,
    });
  }, [handlePlayerAction, isMuted, volume, volumeCallback, unmuteVolumeRef]);
}

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
