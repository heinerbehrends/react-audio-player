import { useMemo, useReducer, memo } from "react";
import { initialState, type SliderContext } from "../Slider/SliderContext";
import { VolumeContext } from "./VolumeContext";
import { volumeReducer } from "./volumeReducer";
import { useAttachSliderCallback } from "../Slider/sliderHooks";

type VolumeProviderProps = {
  children: React.ReactNode;
  orientation: "horizontal" | "vertical";
};

export const VolumeProvider = memo(function VolumeProvider({
  children,
  orientation,
}: VolumeProviderProps) {
  const [state, dispatch] = useReducer(
    volumeReducer,
    initialState,
    (state) => ({
      ...state,
      orientation,
    })
  );
  const handleVolumeAction = useAttachSliderCallback({
    component: "volume",
    dispatch,
  });
  const value = useMemo(() => {
    const result: SliderContext = {
      ...state,
      orientation,
      handleSliderAction: handleVolumeAction,
    };
    return result;
  }, [state, handleVolumeAction, orientation]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
