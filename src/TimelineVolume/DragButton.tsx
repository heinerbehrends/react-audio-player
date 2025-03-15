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
import { AudioContext } from "../AudioElement/AudioContext";
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
  const { xOffset, dragState, timelineWidth, time, handleTimelineAction } =
    useContext(switchContext[type]);
  const { handlePlayerAction } = useContext(PlayerContext);
  const { audioElement } = useContext(AudioContext);

  const offset = useMemo(
    () =>
      getOffset({
        type,
        time,
        duration: audioElement?.duration,
        timelineWidth,
        dragState,
        xOffset,
      }),
    [type, time, audioElement?.duration, timelineWidth, dragState, xOffset]
  );

  const handlePointerDown = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_START",
      clientX: offset,
    });
  }, [handleTimelineAction, offset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        currentTime: time,
        duration: audioElement?.duration ?? 0,
        handleTimelineAction,
        handlePlayerAction,
        type,
      }),
    [time, handleTimelineAction, handlePlayerAction, type, audioElement]
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
