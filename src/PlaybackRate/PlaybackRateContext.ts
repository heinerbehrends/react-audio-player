import { createContext } from "react";
import { SliderContext } from "../Slider/SliderContext";

export const PlaybackRateContext = createContext<SliderContext>({
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
});
