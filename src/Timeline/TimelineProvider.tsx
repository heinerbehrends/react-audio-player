import {
  useReducer,
  useMemo,
  useCallback,
  useContext,
  memo,
  useEffect,
} from "react";
import {
  TimelineContext,
  initialState,
  isTimelineSideEffect,
  isTimelineAction,
  type TimelineContextType,
  type TimelineProviderAction,
} from "./TimelineContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { timelineReducer } from "./timelineReducer";
import { PlayerContext } from "../Player/PlayerContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};
export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
    timelineCallbackRef,
  } = useContext(AudioContext);
  const { getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const [state, dispatch] = useReducer(timelineReducer, {
    ...initialState,
    minValue: 0,
    maxValue: duration,
  });
  const handleTimelineAction = useCallback(
    (action: TimelineProviderAction) => {
      if (isTimelineSideEffect(action)) {
        handleSideEffect(action, audioElement);
      }
      if (isTimelineAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect]
  );

  useEffect(() => {
    if (!timelineCallbackRef.current) {
      return;
    }
    timelineCallbackRef.current.handleTimelineAction = handleTimelineAction;
  }, [handleTimelineAction, timelineCallbackRef]);

  const value: TimelineContextType = useMemo(() => {
    const result: TimelineContextType = {
      sliderStart: state.sliderStart,
      sliderLength: state.sliderLength,
      value: state.value,
      minValue: state.minValue,
      maxValue: duration,
      xyOffset: state.xyOffset,
      dragState: state.dragState,
      orientation: state.orientation,
      handleTimelineAction,
    };
    return result;
  }, [
    state.sliderStart,
    state.sliderLength,
    state.value,
    state.minValue,
    state.xyOffset,
    state.dragState,
    state.orientation,
    handleTimelineAction,
    duration,
  ]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
});
