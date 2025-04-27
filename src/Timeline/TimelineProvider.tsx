import { useReducer, useMemo, useContext, memo } from "react";
import { timelineReducer } from "./timelineReducer";
import { PlayerContext } from "../Player/PlayerContext";
import { initialState, type SliderContext } from "../Slider/SliderContext";
import { useAttachSliderCallback } from "../Slider/sliderHooks";
import { TimelineContext } from "./TimelineContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const { getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const [state, dispatch] = useReducer(timelineReducer, {
    ...initialState,
    value: 0,
    maxValue: duration ?? Infinity,
    orientation: "horizontal",
  });
  const handleTimelineAction = useAttachSliderCallback({
    component: "timeline",
    dispatch,
  });

  const value: SliderContext = useMemo(() => {
    const result: SliderContext = {
      ...state,
      maxValue: duration,
      handleSliderAction: handleTimelineAction,
    };
    return result;
  }, [state, handleTimelineAction, duration]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
});
