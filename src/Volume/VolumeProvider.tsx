import {
  useMemo,
  useReducer,
  memo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { VolumeContext, initialState } from "./VolumeContext";
import {
  isTimelineAction,
  isTimelineSideEffect,
  TimelineContextType,
  type TimelineProviderAction,
} from "../Timeline/TimelineContext";
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
  const [state, dispatch] = useReducer(volumeReducer, initialState);
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
    volumeCallbackRef,
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
    if (!volumeCallbackRef.current) {
      return;
    }
    volumeCallbackRef.current.handleVolumeAction = handleTimelineAction;
  }, [handleTimelineAction, volumeCallbackRef]);

  const value = useMemo(() => {
    const result: TimelineContextType & {
      orientation: "horizontal" | "vertical";
    } = {
      sliderStart: state.sliderStart,
      sliderLength: state.sliderLength,
      value: state.value,
      xyOffset: state.xyOffset,
      dragState: state.dragState,
      handleTimelineAction,
      orientation,
    };
    return result;
  }, [state, handleTimelineAction, orientation]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
