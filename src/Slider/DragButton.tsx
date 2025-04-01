import { handleTimelineKeys } from "../handleKeys";
import {
  useContext,
  useCallback,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { useDrag } from "./useDrag";
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

export function DragButton({ type, ...props }: DragButtonProps) {
  const {
    xyOffset,
    dragState,
    sliderLength,
    value,
    handleTimelineAction,
    orientation,
  } = useContext(switchContext[type]);
  const { handlePlayerAction, volumeState, getPlayerState } =
    useContext(PlayerContext);
  const { duration } = getPlayerState();

  const offset = useMemo(
    () =>
      getOffset({
        type,
        value,
        duration,
        sliderLength,
        dragState,
        xOffset: xyOffset,
        volumeState,
        orientation,
      }),
    [
      type,
      value,
      duration,
      sliderLength,
      dragState,
      xyOffset,
      volumeState,
      orientation,
    ]
  );

  const handlePointerDown = useCallback(() => {
    if (type === "volume") {
      handlePlayerAction({
        type: "UNMUTE",
      });
    }
    if (orientation === "horizontal") {
      handleTimelineAction({
        type: "DRAG_START",
        clientXY: offset,
      });
    }
    if (orientation === "vertical") {
      handleTimelineAction({
        type: "DRAG_START",
        clientXY: offset,
      });
    }
  }, [handleTimelineAction, offset, handlePlayerAction, type, orientation]);

  const handleTouchStart = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_START",
      clientXY: offset,
    });
  }, [handleTimelineAction, offset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        handlePlayerAction,
        type,
        getPlayerState,
      }),
    [handlePlayerAction, type, getPlayerState]
  );
  const style: CSSProperties = useMemo(
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
      ...props.style,
    }),
    [offset, orientation, props.style]
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
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
    />
  );
}

type GetOffsetArgs = {
  type: "timeline" | "volume";
  value: number;
  duration: number;
  sliderLength: number;
  dragState: "dragging" | "idle";
  xOffset: number;
  volumeState: "muted" | "low" | "high";
  orientation: "horizontal" | "vertical";
};

function getOffset({
  type,
  value,
  duration,
  sliderLength,
  dragState,
  xOffset,
  volumeState,
  orientation,
}: GetOffsetArgs): number {
  if (type === "volume" && volumeState === "muted") {
    return 0;
  }
  if (type === "timeline") {
    const progress = value / duration;
    const offset = progress * sliderLength;
    return dragState === "dragging" ? xOffset : offset;
  }
  if (type === "volume") {
    if (orientation === "horizontal") {
      return dragState === "dragging" ? xOffset : sliderLength * value;
    }
    if (orientation === "vertical") {
      return dragState === "dragging"
        ? xOffset
        : sliderLength - sliderLength * value;
    }
  }
  return 0;
}
