import { useContext, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { useIsDisabled } from "../Shared/useIsDisabled";

export function ToggleCaptions() {
  const { showCaptions } = useContext(PlayerContext);
  const handleClick = useToggleCaptions();
  const isDisabled = useIsDisabled();
  return (
    <button
      aria-label="Toggle Captions"
      aria-pressed={showCaptions}
      onClick={handleClick}
      disabled={isDisabled}
    >
      Toggle Captions
    </button>
  );
}

function useToggleCaptions() {
  const { handlePlayerAction } = useContext(PlayerContext);
  return useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_CAPTIONS" });
  }, [handlePlayerAction]);
}
