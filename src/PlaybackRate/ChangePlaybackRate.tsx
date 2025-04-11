import { useCallback, useContext } from "react";
import { useHandleMediaKeys } from "../handleKeys";
import { PlayerContext } from "../Player/PlayerContext";
import { useIsDisabled } from "../useIsDisabled";

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
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleMediaKeys}
      aria-label={
        amount > 0
          ? `Increase playback rate by ${Math.abs(amount)}x`
          : `Decrease playback rate by ${Math.abs(amount)}x`
      }
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

function useHandleClick(amount: number) {
  const { handlePlayerAction, playbackRate } = useContext(PlayerContext);
  return useCallback(() => {
    const newRate = playbackRate + amount;
    const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
  }, [handlePlayerAction, amount, playbackRate]);
}
