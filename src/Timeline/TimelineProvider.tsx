import {
  useReducer,
  useMemo,
  useCallback,
  useContext,
  memo,
  useRef,
  useEffect,
} from "react";
import {
  TimelineContext,
  initialState,
  TimelineContextType,
  TimelineProviderAction,
  isTimelineSideEffect,
  isTimelineAction,
} from "./TimelineVolumeContext";
import { timelineReducer } from "./timelineReducer";
import {
  AudioContext,
  SideEffectAction,
  TimelineProviderRef,
} from "../AudioElement/AudioContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};
export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);
  const { audioElement, handleSideEffect, setTimelineProviderRef } =
    useContext(AudioContext);

  // Create a ref for the timeline provider
  const providerRef = useRef<TimelineProviderRef>({
    handleTimelineAction: null, // Temporary placeholder
  });

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

  // Keep the ref updated with latest state and handler
  useEffect(() => {
    providerRef.current.handleTimelineAction = handleTimelineAction;
  }, [handleTimelineAction]);

  // Create a dummy ref for unregistering
  const nullRef = useRef<TimelineProviderRef>(null!);

  // Register with AudioContextProvider
  useEffect(() => {
    setTimelineProviderRef(providerRef);
    return () => setTimelineProviderRef(nullRef);
  }, [setTimelineProviderRef]);

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
