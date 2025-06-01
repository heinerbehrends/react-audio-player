import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { SliderContextType } from "../Slider/SliderContext";

export function useTimelineAriaAttributes(context: SliderContextType) {
  const { getPlayerState } = useContext(PlayerContext);
  const { currentTime, duration } = getPlayerState();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const ariaLabelMap = {
    playbackRate: "Playback rate slider",
    timeline: "Timeline slider",
    volume: "Volume slider",
  };
  const ariaValueTextMap = {
    playbackRate: `${context.value}x`,
    timeline: `Position ${formatTime(currentTime)} of ${formatTime(duration)}`,
    volume: `${Math.round(context.value * 100)}%`,
  };
  return {
    "aria-label": ariaLabelMap[context.component],
    "aria-valuemin": context.minValue,
    "aria-valuemax": context.maxValue,
    "aria-valuenow": context.value,
    "aria-valuetext": ariaValueTextMap[context.component],
    "aria-orientation": context.orientation,
  };
}
