import { useMemo, useReducer, memo } from "react";
import { VolumeContext } from "./VolumeContext";
import { volumeReducer } from "./volumeReducer";
import { useAttachSliderCallback } from "../Slider/useAttachSliderCallback";
import { initialSliderState } from "../Slider/SliderContext";

type VolumeProviderProps = {
  children: React.ReactNode;
  orientation: "horizontal" | "vertical";
};

export const VolumeProvider = memo(function VolumeProvider({
  children,
  orientation,
}: VolumeProviderProps) {
  const component = "volume";
  const [state, dispatch] = useReducer(volumeReducer, {
    ...initialSliderState,
    value: 1,
    component,
    orientation,
  });

  const handleVolumeAction = useAttachSliderCallback({
    component,
    dispatch,
  });

  const value = useMemo(() => {
    return {
      ...state,
      handleSliderAction: handleVolumeAction,
    };
  }, [state, handleVolumeAction]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
