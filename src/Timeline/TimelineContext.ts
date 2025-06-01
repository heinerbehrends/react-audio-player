import { createContext } from "react";
import { SliderContextType, initialSliderState } from "../Slider/SliderContext";

export const TimelineContext =
  createContext<SliderContextType>(initialSliderState);
