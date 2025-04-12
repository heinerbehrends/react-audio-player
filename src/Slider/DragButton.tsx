import { useHandleSliderKeys } from "../KeyboardControls/keyboardHooks";
import { useContext, useCallback, useMemo } from "react";
import { useDrag } from "./useDrag";
import { TimelineContext } from "../Timeline/TimelineContext";
import { PlayerContext } from "../Player/PlayerContext";
import { VolumeContext } from "../Volume/VolumeContext";

type DragButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  type: "timeline" | "volume";
};

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function DragButton({ type, ...props }: DragButtonProps) {
  const handleDragStart = useHandleDragStart(type);
  const handleKeyDown = useHandleSliderKeys(type);
  const style = useDragStyles(type, props.style ?? {});

  useDrag(type);

  return (
    <button
      aria-label={getAriaLabel(type)}
      {...props}
      style={style}
      onPointerDown={handleDragStart}
      onTouchStart={handleDragStart}
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

function useHandleDragStart(type: "timeline" | "volume") {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  const { handleTimelineAction, orientation } = useContext(switchContext[type]);
  const offset = useOffset(type);

  return useCallback(() => {
    if (type === "volume") {
      handlePlayerAction({
        type: "UNMUTE",
      });
      handlePlayerAction({
        type: "SET_UNMUTE_VOLUME",
        unmuteVolume: getPlayerState().volume,
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
  }, [
    handleTimelineAction,
    orientation,
    offset,
    handlePlayerAction,
    getPlayerState,
    type,
  ]);
}

function useDragStyles(
  type: "timeline" | "volume",
  style: React.CSSProperties
): React.CSSProperties {
  const { orientation } = useContext(switchContext[type]);
  const offset = useOffset(type);
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

function getAriaLabel(type: "timeline" | "volume") {
  return type === "timeline" ? "Drag to seek" : "Drag to adjust volume";
}

function useOffset(type: "timeline" | "volume") {
  const { xyOffset, dragState, sliderLength, value, orientation } = useContext(
    switchContext[type]
  );
  const { getPlayerState, volumeState } = useContext(PlayerContext);
  const { duration } = getPlayerState();

  return useMemo(() => {
    return getOffset({
      type,
      value,
      duration,
      sliderLength,
      dragState,
      xOffset: xyOffset,
      volumeState,
      orientation,
    });
  }, [
    type,
    value,
    duration,
    sliderLength,
    dragState,
    xyOffset,
    volumeState,
    orientation,
  ]);
}

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
  if (type === "volume") {
    return getVolumeOffset({
      value,
      orientation,
      dragState,
      xOffset,
      sliderLength,
      volumeState,
    });
  }
  if (type === "timeline") {
    return getTimelineOffset({
      value,
      duration,
      sliderLength,
      dragState,
      xOffset,
    });
  }
  return 0;
}

type GetVolumeOffsetArgs = {
  value: number;
  sliderLength: number;
  dragState: "dragging" | "idle";
  xOffset: number;
  orientation: "horizontal" | "vertical";
  volumeState: "muted" | "low" | "high";
};

function getVolumeOffset({
  value,
  orientation,
  dragState,
  xOffset,
  sliderLength,
  volumeState,
}: GetVolumeOffsetArgs): number {
  if (volumeState === "muted") {
    if (orientation === "horizontal") {
      return 0;
    }
    if (orientation === "vertical") {
      return sliderLength;
    }
  }
  if (orientation === "horizontal") {
    return dragState === "dragging" ? xOffset : sliderLength * value;
  }
  if (orientation === "vertical") {
    return dragState === "dragging"
      ? xOffset
      : sliderLength - sliderLength * value;
  }
  return 0;
}

type GetTimelineOffsetArgs = {
  value: number;
  duration: number;
  sliderLength: number;
  dragState: "dragging" | "idle";
  xOffset: number;
};

function getTimelineOffset({
  value,
  duration,
  sliderLength,
  dragState,
  xOffset,
}: GetTimelineOffsetArgs): number {
  const progress = value / duration;
  const offset = progress * sliderLength;
  return dragState === "dragging" ? xOffset : offset;
}
