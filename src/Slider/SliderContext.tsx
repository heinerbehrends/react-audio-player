/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit; splitting them would mean exporting
   the context object, which is the handle the null-default guard keeps private. */
import { createContext, useContext } from "react";
import type { SliderValue } from "./useSlider";

/**
 * One instance per slider, published by the slider root and read by its sibling
 * subcomponents. A compound-component context, not a bus: it flows strictly
 * downward.
 *
 * No default value, for the reason the store context has none: a default is why
 * a missing-provider guard can never fire.
 */
const SliderContext = createContext<SliderValue | null>(null);
SliderContext.displayName = "SliderContext";

type SliderProviderProps = {
  value: SliderValue;
  children: React.ReactNode;
};

export function SliderProvider({ value, children }: SliderProviderProps) {
  return (
    <SliderContext.Provider value={value}>{children}</SliderContext.Provider>
  );
}

export function useSliderContext(): SliderValue {
  const slider = useContext(SliderContext);
  if (!slider) {
    throw new Error(
      "Slider subcomponents must be used inside their slider root — " +
        "<Timeline>, <Volume> or <PlaybackRateSlider>",
    );
  }
  return slider;
}
