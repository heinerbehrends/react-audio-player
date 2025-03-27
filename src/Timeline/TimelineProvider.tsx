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
} from "./TimelineVolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { timelineReducer } from "./timelineReducer";

type TimelineProviderProps = {
  children: React.ReactNode;
};
export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
    timelineCallbackRef,
  } = useContext(AudioContext);

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
      time: state.time,
      xOffset: state.xOffset,
      dragState: state.dragState,
      handleTimelineAction,
    };
    return result;
  }, [
    state.sliderStart,
    state.sliderLength,
    state.time,
    state.xOffset,
    state.dragState,
    handleTimelineAction,
  ]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
});
