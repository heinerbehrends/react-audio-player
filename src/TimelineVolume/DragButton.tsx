import { handleTimelineKeys } from "./handleKeys";
import {
  useContext,
  type HTMLAttributes,
  useCallback,
  useMemo,
  CSSProperties,
} from "react";
import { useDrag } from "../useDrag";
import { TimelineContext } from "../Timeline/TimelineContext";
import { PlayerContext } from "../Player/PlayerContext";
import { VolumeContext } from "../Volume/VolumeContext";

type DragButtonProps = HTMLAttributes<HTMLButtonElement> & {
  type: "timeline" | "volume";
};

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

function getOffset({
  type,
  time,
  duration,
  timelineWidth,
  dragState,
  xOffset,
}: {
  type: "timeline" | "volume";
  time: number;
  duration: number | undefined;
  timelineWidth: number;
  dragState: "dragging" | "idle";
  xOffset: number;
}): number {
  if (type === "timeline") {
    const progress = time / (duration ?? 1);
    return dragState === "dragging" ? xOffset : progress * timelineWidth;
  }
  if (type === "volume") {
    return dragState === "dragging" ? xOffset : timelineWidth * time;
  }
  return 0;
}

export function DragButton({ type, ...props }: DragButtonProps) {
  const { xOffset, dragState, timelineWidth, time, dispatch } = useContext(
    switchContext[type]
  );
  const { element, dispatch: dispatchPlayer } = useContext(PlayerContext);

  const offset = useMemo(
    () =>
      getOffset({
        type,
        time,
        duration: element?.duration,
        timelineWidth,
        dragState,
        xOffset,
      }),
    [type, time, element?.duration, timelineWidth, dragState, xOffset]
  );

  const handlePointerDown = useCallback(() => {
    dispatch({
      type: "DRAG_START",
      clientX: offset,
    });
  }, [dispatch, offset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        currentTime: time,
        duration: element?.duration ?? 0,
        dispatch,
        dispatchPlayer,
        type,
      }),
    [time, element?.duration, dispatch, dispatchPlayer, type]
  );

  const style: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      cursor: "grab",
      transform: `translate(calc(${offset}px - 20px), 0)`,
      ...props.style,
    }),
    [offset, props.style]
  );

  useDrag(type);

  return (
    <button
      {...props}
      style={style}
      aria-label={
        type === "timeline" ? "Drag to seek" : "Drag to adjust volume"
      }
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    />
  );
}
