import { createContext, useContext } from "react";
import { SliderContextType, initialSliderState } from "../Slider/SliderContext";

export const TimelineContext =
  createContext<SliderContextType>(initialSliderState);

export function useTimelineContext() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimelineContext must be used within a TimelineContext");
  }
  return context;
}
