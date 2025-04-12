import { useCallback, useContext, useMemo } from "react";
import { TimelineContext, TimelineContextType } from "./TimelineContext";
import { useOffset, getOffset, useDragStyles } from "../Slider/sliderHooks";
import { PlayerContext } from "../Player/PlayerContext";
import { VolumeContextType } from "../Volume/VolumeContext";
import { getClientXY } from "../Slider/useDrag";
import { calculateTime } from "../Shared/sharedFunctions";

export function useHandleDragStartTimeline() {
  const { handleTimelineAction } = useContext(TimelineContext);
  const context = useContext(TimelineContext);
  const offset = useOffset({ context, getOffset });
  return useCallback(() => {
    handleTimelineAction({ type: "DRAG_START", clientXY: offset });
  }, [handleTimelineAction, offset]);
}

export function useHandleDragEndTimeline() {
  const { getPlayerState } = useContext(PlayerContext);
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    useContext(TimelineContext);
  const { duration } = getPlayerState();

  return useCallback(
    (event: PointerEvent | TouchEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "DRAG_END",
        component: "timeline",
        clientXY,
        duration,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [handleTimelineAction, duration, sliderLength, sliderStart, orientation]
  );
}

export function useHandleDragTimeline() {
  const { getPlayerState } = useContext(PlayerContext);
  const context = useContext(TimelineContext);
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    context;
  const { duration } = getPlayerState();
  return useCallback(
    (event: PointerEvent | TouchEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "DRAG",
        component: "timeline",
        clientXY,
        duration,
        sliderLength,
        sliderStart,
      });
    },
    [handleTimelineAction, duration, sliderLength, sliderStart, orientation]
  );
}

export function useHandleSeek() {
  const context = useContext(TimelineContext);
  const { getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const { sliderStart, sliderLength, handleTimelineAction, orientation } =
    context;

  return useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xyOffset =
        orientation === "horizontal" ? event.clientX : event.clientY;
      const value = calculateTime({
        xyOffset,
        sliderStart,
        sliderLength,
        duration,
      });

      handleTimelineAction({
        type: "CHANGE_VALUE",
        value,
        component: "timeline",
      });
    },
    [handleTimelineAction, duration, sliderStart, sliderLength, orientation]
  );
}

export type UseDragStylesArgs = {
  context: TimelineContextType | VolumeContextType;
  style: React.CSSProperties;
};

export function useTimelineAriaAttributes() {
  const { getPlayerState } = useContext(PlayerContext);
  const { currentTime, duration } = getPlayerState();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    "aria-label": "Seek audio",
    "aria-valuemin": 0,
    "aria-valuemax": duration,
    "aria-valuenow": currentTime,
    "aria-valuetext": `Position ${formatTime(currentTime)} of ${formatTime(
      duration
    )} (${Math.round((currentTime / duration) * 100)}% complete)`,
  };
}

export function useTimelineIndicatorStyles({
  context,
  style,
}: UseDragStylesArgs): React.CSSProperties {
  const { sliderLength } = context;
  const offset = useOffset({ context, getOffset });
  const progress = offset / sliderLength;
  return useMemo(
    () => ({
      transform: `scaleX(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: "left",
      ...style,
    }),
    [progress, style]
  );
}

export function useTimelineDragProps(style: React.CSSProperties) {
  const context = useContext(TimelineContext);
  return {
    handleDragStart: useHandleDragStartTimeline(),
    handleDragEnd: useHandleDragEndTimeline(),
    handleDrag: useHandleDragTimeline(),
    style: useDragStyles({ context, style }),
  };
}
