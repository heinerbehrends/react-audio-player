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
} from "../Timeline/TimelineVolumeContext";
import { volumeReducer } from "./volumeReducer";
import { AudioContext } from "../AudioElement/AudioContext";

type VolumeProviderProps = {
  children: React.ReactNode;
};

export const VolumeProvider = memo(function VolumeProvider({
  children,
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
    const result: TimelineContextType = {
      sliderStart: state.sliderStart,
      sliderLength: state.sliderLength,
      time: state.time,
      xOffset: state.xOffset,
      dragState: state.dragState,
      handleTimelineAction,
    };
    return result;
  }, [state, handleTimelineAction]);

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
