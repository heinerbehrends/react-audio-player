import { useCallback, useContext } from "react";
import { handleMediaKeys } from "../handleKeys";
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
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);

  const handleClick = useCallback(
    function handleClick() {
      const { playbackRate } = getPlayerState();
      const newRate = playbackRate + amount;
      const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
      handlePlayerAction({
        type: "SET_PLAYBACK_RATE",
        playbackRate: limitedRate,
      });
    },
    [amount, handlePlayerAction, getPlayerState]
  );

  return (
    <button
      onClick={handleClick}
      onKeyDown={(event) => {
        console.log("onKeyDown", event);
        handleMediaKeys({
          event,
          handlePlayerAction,
          getPlayerState,
        });
      }}
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
