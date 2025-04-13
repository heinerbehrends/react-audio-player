import { useCallback, useMemo, useReducer } from "react";
import { TimelineContextAction } from "../Timeline/TimelineContext";
import {
  PlaybackRateContext,
  PlaybackRateContextType,
} from "./PlaybackRateContext";
import { playbackRateReducer } from "./playbackRateReducer";

const initialState: PlaybackRateContextType = {
  sliderStart: 0,
  sliderLength: 0,
  value: 1,
  minValue: 0.5,
  maxValue: 4,
  step: 0.25,
  orientation: "horizontal",
  xyOffset: 0,
  dragState: "idle",
  handleTimelineAction: () => {},
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
  const handlePlaybackRateAction = useCallback(
    (action: TimelineContextAction) => {
      dispatch(action);
    },
    [dispatch]
  );
  const value = useMemo(() => {
    const result: PlaybackRateContextType = {
      ...state,
      handleTimelineAction: handlePlaybackRateAction,
    };
    return result;
  }, [state, handlePlaybackRateAction]);
  return (
    <PlaybackRateContext.Provider value={value}>
      {children}
    </PlaybackRateContext.Provider>
  );
}
