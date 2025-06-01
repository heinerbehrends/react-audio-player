import { createContext } from "react";
import { SliderContextType, initialSliderState } from "../Slider/SliderContext";

export const VolumeContext =
  createContext<SliderContextType>(initialSliderState);
