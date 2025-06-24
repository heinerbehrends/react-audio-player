import { createContext, useContext } from "react";
import { SliderContextType } from "../Slider/SliderContext";

export const PlaybackRateContext = createContext<SliderContextType>({
  sliderStart: 0,
  sliderLength: 0,
  value: 0,
  minValue: 0.5,
  maxValue: 4,
  step: 0.25,
  clientXY: 0,
  dragState: "idle",
  orientation: "horizontal",
  component: "playbackRate",
  handleSliderAction: () => {},
  offsetFromMiddle: 0,
});

export function usePlaybackRateContext() {
  const context = useContext(PlaybackRateContext);
  if (!context) {
    throw new Error(
      "usePlaybackRateContext must be used within a PlaybackRateContext",
    );
  }
  return context;
}
