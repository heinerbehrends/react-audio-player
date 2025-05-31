import { useReducer, useMemo, memo } from "react";
import { timelineReducer } from "./timelineReducer";
import {
  initialSliderState,
  type SliderContext,
} from "../Slider/SliderContext";
import { useAttachSliderCallback } from "../Slider/useAttachSliderCallback";
import { TimelineContext } from "./TimelineContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export const TimelineProvider = memo(function TimelineProvider({
  children,
}: TimelineProviderProps) {
  const component = "timeline";
  const [state, dispatch] = useReducer(timelineReducer, initialSliderState);

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
