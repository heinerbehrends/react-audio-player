import { createContext, useContext } from "react";
import { SliderContextType, initialSliderState } from "../Slider/SliderContext";

export const VolumeContext =
  createContext<SliderContextType>(initialSliderState);

export function useVolumeContext() {
  const context = useContext(VolumeContext);
  if (!context) {
    throw new Error("useVolumeContext must be used within a VolumeContext");
  }
  return context;
}
