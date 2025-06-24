import { usePlayerContext } from "../Player/PlayerContext";
import { useIsDisabled } from "../Shared/useIsDisabled";
import { useToggleCaptions } from "./captionsHooks";

export function ToggleCaptions() {
  const { showCaptions } = usePlayerContext();
  const handleClick = useToggleCaptions();
  const isDisabled = useIsDisabled();
  return (
    <button
      aria-label="Toggle Captions"
      aria-pressed={showCaptions}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {showCaptions ? "Hide Captions" : "Show Captions"}
    </button>
  );
}
