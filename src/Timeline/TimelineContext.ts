import { createContext } from "react";
import { SliderContext, initialSliderState } from "../Slider/SliderContext";

export const TimelineContext = createContext<SliderContext>(initialSliderState);
