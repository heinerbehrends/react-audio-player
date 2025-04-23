import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

export function useVolumeAriaAttributes() {
  const { getPlayerState } = useContext(PlayerContext);
  const { volume } = getPlayerState();
  return {
    "aria-label": "Adjust volume",
    "aria-valuemin": 0,
    "aria-valuemax": 1,
    "aria-valuenow": volume,
    "aria-valuetext": `Volume ${Math.round(volume * 100)}%`,
  };
}
