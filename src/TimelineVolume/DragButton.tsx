import { handleTimelineKeys } from "../handleKeys";
import {
  useContext,
  useCallback,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { useDrag } from "./useDrag";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
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

export function DragButton({ type, ...props }: DragButtonProps) {
  const { xOffset, dragState, sliderLength, time, handleTimelineAction } =
    useContext(switchContext[type]);
  const { handlePlayerAction, volumeState } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);

  const offset = useMemo(
    () =>
      getOffset({
        type,
        time,
        duration: audioElement?.duration,
        sliderLength,
        dragState,
        xOffset,
        volumeState,
      }),
    [
      type,
      time,
      audioElement?.duration,
      sliderLength,
      dragState,
      xOffset,
      volumeState,
    ]
  );

  const handlePointerDown = useCallback(() => {
    if (type === "volume") {
      handlePlayerAction({
        type: "UNMUTE",
      });
    }
    handleTimelineAction({
      type: "DRAG_START",
      clientX: offset,
    });
  }, [handleTimelineAction, offset, handlePlayerAction, type]);

  const handleTouchStart = useCallback(() => {
    handleTimelineAction({
      type: "DRAG_START",
      clientX: offset,
    });
  }, [handleTimelineAction, offset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        handlePlayerAction,
        type,
        audioElement,
      }),
    [handlePlayerAction, type, audioElement]
  );

  const style: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      cursor: "grab",
      transform: `translate(calc(${offset}px - 20px), 0)`,
      touchAction: "none",
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
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
    />
  );
}

type GetOffsetArgs = {
  type: "timeline" | "volume";
  time: number;
  duration: number | undefined;
  sliderLength: number;
  dragState: "dragging" | "idle";
  xOffset: number;
  volumeState: "muted" | "low" | "high";
};

function getOffset({
  type,
  time,
  duration,
  sliderLength,
  dragState,
  xOffset,
  volumeState,
}: GetOffsetArgs): number {
  if (type === "volume" && volumeState === "muted") {
    return 0;
  }
  if (type === "timeline") {
    const progress = time / (duration ?? 1);
    return dragState === "dragging" ? xOffset : progress * sliderLength;
  }
  if (type === "volume") {
    return dragState === "dragging" ? xOffset : sliderLength * time;
  }
  return 0;
}
