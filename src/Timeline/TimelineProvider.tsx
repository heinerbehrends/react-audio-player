import { useReducer, useMemo, useCallback, useContext, memo } from "react";
import {
  TimelineContext,
  initialState,
  TimelineContextAction,
  TimelineContextType,
} from "./TimelineContext";
import { timelineReducer } from "./timelineReducer";
import { AudioContext, SideEffectAction } from "../AudioElement/AudioContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export type TimelineProviderAction = SideEffectAction | TimelineContextAction;

// Extract action types for better type safety
type SideEffectActionType = SideEffectAction["type"];
type TimelineActionType = TimelineContextAction["type"];

// Define actions that need side effects
const TIMELINE_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  DRAG: true,
  DRAG_END: true,
  SEEK_TO_TIME: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  AUDIO_FILE_ENDED: true,
};

const TIMELINE_DISPATCH_MAP: Record<TimelineActionType, true> = {
  TIMELINE_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_TIME: true,
  SEEK_TO_TIME: true,
};

function isTimelineSideEffect(
  action: TimelineProviderAction
): action is SideEffectAction {
  return TIMELINE_SIDE_EFFECT_MAP[action.type as SideEffectActionType] === true;
}

function isTimelineAction(
  action: TimelineProviderAction
): action is TimelineContextAction {
  return TIMELINE_DISPATCH_MAP[action.type as TimelineActionType] === true;
}

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
