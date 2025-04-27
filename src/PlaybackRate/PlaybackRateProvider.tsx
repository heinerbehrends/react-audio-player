import { useMemo, useReducer } from "react";
import { SliderContext } from "../Slider/SliderContext";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { playbackRateReducer } from "./playbackRateReducer";
import { useAttachSliderCallback } from "../Slider/sliderHooks";

const initialState: SliderContext = {
  sliderStart: 0,
  sliderLength: 0,
  value: 1,
  minValue: 0.5,
  maxValue: 4,
  step: 0.25,
  orientation: "horizontal",
  xyOffset: 0,
  dragState: "idle",
  handleSliderAction: () => {},
};

type PlaybackRateProviderProps = {
  children: React.ReactNode;
  minValue: number | undefined;
  maxValue: number | undefined;
  step: number | undefined;
};

export function PlaybackRateProvider({
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
    const result: SliderContext = {
      ...state,
      handleSliderAction: handlePlaybackRateAction,
    };
    return result;
  }, [state, handlePlaybackRateAction]);
  return (
    <PlaybackRateContext.Provider value={value}>
      {children}
    </PlaybackRateContext.Provider>
  );
}
