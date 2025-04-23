import { useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import {
  type SliderProviderAction,
  isSliderSideEffect,
  isSliderAction,
  SliderContext,
} from "../Slider/SliderContext";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { playbackRateReducer } from "./playbackRateReducer";
import { AudioContext } from "../AudioElement/AudioContext";

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
  minValue?: number;
  maxValue?: number;
  step?: number;
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
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
    playbackRateCallbackRef,
  } = useContext(AudioContext);

  const handlePlaybackRateAction = useCallback(
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
    if (!playbackRateCallbackRef?.current) {
      return;
    }
    playbackRateCallbackRef.current.handlePlaybackRateAction =
      handlePlaybackRateAction;
  }, [handlePlaybackRateAction, playbackRateCallbackRef]);

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
