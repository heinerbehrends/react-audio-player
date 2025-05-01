import { useCallback, useContext } from "react";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { PlayerContext } from "../Player/PlayerContext";
import { useIsDisabled } from "../Shared/useIsDisabled";

type IncreaseDecreaseProps = {
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ChangePlaybackRate({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  const handleChangePlaybackRate = useChangePlaybackRate(amount);
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      onClick={handleChangePlaybackRate}
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

function useChangePlaybackRate(amount: number) {
  const { handlePlayerAction, playbackRate } = useContext(PlayerContext);
  return useCallback(() => {
    const newRate = playbackRate + amount;
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: newRate,
    });
  }, [handlePlayerAction, amount, playbackRate]);
}
