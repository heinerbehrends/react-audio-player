import { useCallback, useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { calculateValue } from "../Shared/sharedFunctions";

export function useSetPlaybackRate() {
  const context = useContext(PlaybackRateContext);
  const {
    sliderStart,
    sliderLength,
    handleSliderAction: handleTimelineAction,
    minValue,
    maxValue,
    orientation,
  } = context;
  return useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xyOffset =
        orientation === "horizontal" ? event.clientX : event.clientY;
      const value = calculateValue({
        xyOffset,
        sliderStart,
        sliderLength,
        minValue,
        maxValue,
      });
      handleTimelineAction({
        type: "CHANGE_VALUE",
        value,
        component: "playbackRate",
      });
    },
    [
      handleTimelineAction,
      minValue,
      maxValue,
      orientation,
      sliderLength,
      sliderStart,
    ]
  );
}
