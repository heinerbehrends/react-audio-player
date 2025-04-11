import { useCallback, useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { useHandleMediaKeys } from "../handleKeys";
import { useIsDisabled } from "../useIsDisabled";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Seek({ children, amount, ...props }: SeekButtonComponentProps) {
  const seekAmount = useSeek(amount);
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      aria-label={`Seek ${amount}`}
      onKeyDown={handleMediaKeys}
      onClick={seekAmount}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

function useSeek(amount: number) {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  return useCallback(() => {
    const { currentTime } = getPlayerState();
    handlePlayerAction({
      type: "CHANGE_VALUE",
      component: "timeline",
      value: currentTime + amount,
    });
  }, [handlePlayerAction, getPlayerState, amount]);
}
