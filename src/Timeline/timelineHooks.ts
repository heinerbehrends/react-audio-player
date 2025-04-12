import { useCallback, useContext, useMemo } from "react";
import { TimelineContext, TimelineContextType } from "./TimelineContext";
import { useOffset } from "../Slider/sliderHooks";
import { PlayerContext } from "../Player/PlayerContext";
import { VolumeContextType } from "../Volume/VolumeContext";
import { getClientXY } from "../Slider/useDrag";
import { calculateTime } from "../Shared/sharedFunctions";

export function useHandleDragStartTimeline() {
  const { handleTimelineAction } = useContext(TimelineContext);
  const context = useContext(TimelineContext);
  const offset = useOffset({ context, type: "timeline" });
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

export function useHandleDragTimeline(
  context: TimelineContextType | VolumeContextType
) {
  const { getPlayerState } = useContext(PlayerContext);
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

export function useHandleSeek(
  context: TimelineContextType | VolumeContextType
) {
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

export function useDragStylesTimeline({
  context,
  style,
}: UseDragStylesArgs): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset({ context, type: "timeline" });
  return useMemo(
    () => ({
      position: "absolute",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      cursor: "grab",
      transform:
        orientation === "horizontal"
          ? `translate(calc(${offset}px - 20px), 0)`
          : `translate(0, calc(${offset}px - 20px))`,
      touchAction: "none",
      ...style,
    }),
    [offset, orientation, style]
  );
}

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
