import { createContext } from "react";
import { SliderContext, initialSliderState } from "../Slider/SliderContext";

export const VolumeContext = createContext<SliderContext>(initialSliderState);
