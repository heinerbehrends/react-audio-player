import {
  useReducer,
  useMemo,
  useCallback,
  useContext,
  memo,
  useEffect,
} from "react";
import { TimelineContext } from "./TimelineContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { timelineReducer } from "./timelineReducer";
import { PlayerContext } from "../Player/PlayerContext";
import {
  initialState,
  isSliderSideEffect,
  isSliderAction,
  type SliderContext,
  type SliderProviderAction,
} from "../Slider/SliderContext";

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
    value: 0,
    maxValue: duration,
    orientation: "horizontal",
  });
  const handleTimelineAction = useCallback(
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
    if (!timelineCallbackRef.current) {
      return;
    }
    timelineCallbackRef.current.handleTimelineAction = handleTimelineAction;
  }, [handleTimelineAction, timelineCallbackRef]);

  const value: SliderContext = useMemo(() => {
    const result: SliderContext = {
      sliderStart: state.sliderStart,
      sliderLength: state.sliderLength,
      value: state.value,
      minValue: state.minValue,
      maxValue: duration,
      xyOffset: state.xyOffset,
      dragState: state.dragState,
      orientation: state.orientation,
      handleSliderAction: handleTimelineAction,
      step: state.step,
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
    state.step,
  ]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
});
