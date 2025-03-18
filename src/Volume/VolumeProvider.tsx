import { useMemo, useReducer, memo, useCallback, useContext } from "react";
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

  const value = useMemo(() => {
    const result: TimelineContextType = {
      timelineLeft: state.timelineLeft,
      timelineWidth: state.timelineWidth,
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
