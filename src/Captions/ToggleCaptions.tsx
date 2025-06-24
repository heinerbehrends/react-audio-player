import { useCaptionsContext } from "./CaptionsContext";
import { useIsDisabled } from "../Shared/useIsDisabled";
import { useToggleCaptions } from "./captionsHooks";

export function ToggleCaptions() {
  const { showCaptions } = useCaptionsContext();
  const toggleCaptions = useToggleCaptions();
  const isDisabled = useIsDisabled();
  return (
    <button
      aria-label="Toggle Captions"
      aria-pressed={showCaptions}
      onClick={toggleCaptions}
      disabled={isDisabled}
    >
      {showCaptions ? "Hide Captions" : "Show Captions"}
    </button>
  );
}
