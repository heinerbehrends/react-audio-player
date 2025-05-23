import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { useIsDisabled } from "../Shared/useIsDisabled";
import { useToggleCaptions } from "./hooks/captionsHooks";

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
