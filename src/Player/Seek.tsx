import { useCallback, useContext } from "react";
import { PlayerContext } from "./PlayerContext";
import { handleMediaKeys } from "../handleKeys";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
};

export function Seek({ children, amount }: SeekButtonComponentProps) {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  const handleClick = useCallback(() => {
    const { currentTime } = getPlayerState();
    handlePlayerAction({
      type: "CHANGE_VALUE",
      component: "timeline",
      value: currentTime + amount,
    });
  }, [handlePlayerAction, getPlayerState, amount]);
  return (
    <button
      aria-label={`Seek ${amount}`}
      onKeyDown={(event) =>
        handleMediaKeys({ event, handlePlayerAction, getPlayerState })
      }
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
