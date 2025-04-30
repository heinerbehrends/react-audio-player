import { useCallback, useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { calculateSliderValue } from "../Shared/sharedFunctions";

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
      const clientXY =
        orientation === "horizontal" ? event.clientX : event.clientY;
      const value = calculateSliderValue({
        clientXY,
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
