import { createContext } from "react";
import { SliderContext, initialState } from "../Slider/SliderContext";

export const VolumeContext = createContext<SliderContext>(initialState);
