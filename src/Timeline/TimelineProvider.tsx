import { useReducer, useMemo, useCallback, useContext, memo } from "react";
import {
  TimelineContext,
  initialState,
  TimelineContextType,
  TimelineProviderAction,
  isTimelineSideEffect,
  isTimelineAction,
} from "./TimelineVolumeContext";
import { timelineReducer } from "./timelineReducer";
import { AudioContext, SideEffectAction } from "../AudioElement/AudioContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};
export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);
  const { audioElement, handleSideEffect } = useContext(AudioContext);

  const handleTimelineAction = useCallback(
    (action: TimelineProviderAction) => {
      if (isTimelineSideEffect(action)) {
        handleSideEffect(action as unknown as SideEffectAction, audioElement);
      }
      if (isTimelineAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect]
  );

  // Create value with explicit property listing, no object spread,
  // ensuring TypeScript will error if properties are missing or extra
  const value: TimelineContextType = useMemo(() => {
    const result: TimelineContextType = {
      timelineLeft: state.timelineLeft,
      timelineWidth: state.timelineWidth,
      time: state.time,
      xOffset: state.xOffset,
      dragState: state.dragState,
      handleTimelineAction,
    };
    return result;
  }, [
    state.timelineLeft,
    state.timelineWidth,
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
