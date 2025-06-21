import type { SliderContextType } from "../Slider/SliderContext";
import { useAudioElement } from "../AudioElement/useAudioElement";
import { formatTime } from "../Shared/sharedFunctions";

export function useTimelineAriaAttributes(context: SliderContextType) {
  const { currentTime, duration } = useAudioElement();

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
