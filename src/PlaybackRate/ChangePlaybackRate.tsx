import { useCallback, useContext } from "react";
import { useHandleMediaKeys } from "../handleKeys";
import { PlayerContext } from "../Player/PlayerContext";

type IncreaseDecreaseProps = {
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ChangePlaybackRate({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  const handleClick = useHandleClick(amount);

  const handleKeyDown = useHandleMediaKeys();

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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

function useHandleClick(amount: number) {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  return useCallback(() => {
    const { playbackRate } = getPlayerState();
    const newRate = playbackRate + amount;
    const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
  }, [handlePlayerAction, getPlayerState, amount]);
}
