import { useCallback, useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { calculateValue } from "../Shared/sharedFunctions";

export function useSetPlaybackRate() {
  const context = useContext(PlaybackRateContext);
  const {
    sliderStart,
    sliderLength,
    handleSliderAction,
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
      handleSliderAction({
        type: "CHANGE_VALUE",
        value,
        component: "playbackRate",
      });
    },
    [
      handleSliderAction,
      minValue,
      maxValue,
      orientation,
      sliderLength,
      sliderStart,
    ]
  );
}
