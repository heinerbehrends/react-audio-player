import { createContext } from "react";
import { SliderContext, initialState } from "../Slider/SliderContext";

export const TimelineContext = createContext<SliderContext>(initialState);
