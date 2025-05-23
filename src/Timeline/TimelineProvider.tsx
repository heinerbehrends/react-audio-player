import { useReducer, useMemo, useContext, memo } from "react";
import { timelineReducer } from "./timelineReducer";
import { PlayerContext } from "../Player/PlayerContext";
import { initialState, type SliderContext } from "../Slider/SliderContext";
import { useAttachSliderCallback } from "../Slider/hooks/useAttachSliderCallback";
import { TimelineContext } from "./TimelineContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const { getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const component = "timeline";

  const [state, dispatch] = useReducer(timelineReducer, {
    ...initialState,
    value: 0,
    maxValue: duration ?? 1,
    orientation: "horizontal",
    component,
  });

  const handleTimelineAction = useAttachSliderCallback({
    component,
    dispatch,
  });

  const value: SliderContext = useMemo(() => {
    return {
      ...state,
      handleSliderAction: handleTimelineAction,
    };
  }, [state, handleTimelineAction]);

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
});
