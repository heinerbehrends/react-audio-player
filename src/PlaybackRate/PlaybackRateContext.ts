import { createContext } from "react";
import { TimelineContextAction } from "../Timeline/TimelineContext";

export type PlaybackRateContextType = {
  sliderStart: number;
  sliderLength: number;
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  xyOffset: number;
  dragState: "idle" | "dragging";
  orientation: "horizontal" | "vertical";
  handleTimelineAction: (action: TimelineContextAction) => void;
};

export const PlaybackRateContext = createContext<PlaybackRateContextType>({
  sliderStart: 0,
  sliderLength: 0,
  value: 0,
  minValue: 0.5,
  maxValue: 4,
  step: 0.25,
  xyOffset: 0,
  dragState: "idle",
  orientation: "horizontal",
  handleTimelineAction: () => {},
});
