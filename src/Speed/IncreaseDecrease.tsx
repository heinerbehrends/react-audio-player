import { useCallback, useContext } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { handleMediaKeys } from "../handleKeys";
import { PlayerContext } from "../Player/PlayerContext";
type IncreaseDecreaseProps = {
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function IncreaseDecrease({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { handlePlayerAction } = useContext(PlayerContext);

  const handleClick = useCallback(
    function handleClick() {
      if (!audioElement) return;
      const newRate = audioElement.playbackRate + amount;
      const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
      audioElement.playbackRate = limitedRate;
    },
    [amount, audioElement]
  );

  return (
    <button
      onClick={handleClick}
      onKeyDown={(event) =>
        handleMediaKeys({
          event,
          handlePlayerAction,
          audioElement,
        })
      }
      aria-label={
        amount > 0
          ? `Increase playback rate by ${Math.abs(amount)}x`
          : `Decrease playback rate by ${Math.abs(amount)}x`
      }
      {...props}
    >
      {children}
    </button>
  );
}
