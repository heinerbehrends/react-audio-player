import {
  useMemo,
  useReducer,
  memo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import {
  isSliderAction,
  isSliderSideEffect,
  initialState,
  type SliderProviderAction,
  type SliderContext,
} from "../Slider/SliderContext";
import { VolumeContext } from "./VolumeContext";
import { volumeReducer } from "./volumeReducer";
import { AudioContext } from "../AudioElement/AudioContext";

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
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
    volumeCallbackRef,
  } = useContext(AudioContext);

  const handleVolumeAction = useCallback(
    (action: SliderProviderAction) => {
      if (isSliderSideEffect(action)) {
        handleSideEffect(action, audioElement);
      }
      if (isSliderAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect]
  );

  useEffect(() => {
    if (!volumeCallbackRef.current) {
      return;
    }
    volumeCallbackRef.current.handleVolumeAction = handleVolumeAction;
  }, [handleVolumeAction, volumeCallbackRef]);

  const value = useMemo(() => {
    const result: SliderContext = {
      sliderStart: state.sliderStart,
      sliderLength: state.sliderLength,
      value: state.value,
      minValue: state.minValue,
      maxValue: state.maxValue,
      xyOffset: state.xyOffset,
      dragState: state.dragState,
      handleSliderAction: handleVolumeAction,
      orientation,
      step: state.step,
    };
    return result;
  }, [state, handleVolumeAction, orientation]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
