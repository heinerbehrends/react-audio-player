import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

export function useTimelineAriaAttributes() {
  const { getPlayerState } = useContext(PlayerContext);
  const { currentTime, duration } = getPlayerState();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    "aria-label": "Click timeline to seek",
    "aria-valuemin": 0,
    "aria-valuemax": duration,
    "aria-valuenow": currentTime,
    "aria-valuetext": `Position ${formatTime(currentTime)} of ${formatTime(
      duration
    )} (${Math.round((currentTime / duration) * 100)}% complete)`,
  };
}
