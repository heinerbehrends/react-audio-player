import { useMemo, useReducer, memo } from "react";
import { SliderContext } from "../Slider/SliderContext";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { playbackRateReducer } from "./playbackRateReducer";
import { useAttachSliderCallback } from "../Slider/sliderHooks";

const initialState: Omit<SliderContext, "step" | "minValue" | "maxValue"> = {
  sliderStart: 0,
  sliderLength: 0,
  value: 1,
  orientation: "horizontal",
  clientXY: 0,
  dragState: "idle",
  component: "playbackRate",
  handleSliderAction: () => {},
};

type PlaybackRateProviderProps = {
  children: React.ReactNode;
  minValue: number | undefined;
  maxValue: number | undefined;
  step: number | undefined;
};

export const PlaybackRateProvider = memo(function PlaybackRateProvider({
  children,
  minValue = 0.5,
  maxValue = 4,
  step = 0.25,
}: PlaybackRateProviderProps) {
  const [state, dispatch] = useReducer(playbackRateReducer, {
    ...initialState,
    minValue,
    maxValue,
    step,
  });

  const handlePlaybackRateAction = useAttachSliderCallback({
    component: "playbackRate",
    dispatch,
  });

  const value = useMemo(() => {
    return {
      ...state,
      handleSliderAction: handlePlaybackRateAction,
    };
  }, [state, handlePlaybackRateAction]);
  return (
    <PlaybackRateContext.Provider value={value}>
      {children}
    </PlaybackRateContext.Provider>
  );
});
