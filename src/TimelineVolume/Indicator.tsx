import { useContext, type HTMLAttributes } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { useUpdateTime } from "../Timeline/useUpdateTime";

type TimelineProgressProps = HTMLAttributes<HTMLDivElement> & {
  type: "timeline" | "volume";
};

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function Indicator({ type, ...props }: TimelineProgressProps) {
  const { dragState, xOffset, time, timelineWidth } = useContext(
    switchContext[type]
  );
  const { element } = useContext(PlayerContext);
  const duration = element?.duration ?? 1;
  const progress = getProgress({
    type,
    dragState,
    xOffset,
    time,
    duration,
    timelineWidth,
  });

  useUpdateTime();

  return (
    <div
      {...props}
      style={{
        transform: `scaleX(${progress})`,
        width: "100%",
        height: "100%",
        transformOrigin: "left",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        ...props.style,
      }}
      role="progressbar"
      aria-valuenow={time}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-label="audio progress"
    />
  );
}

type getProgressProps = {
  type: "timeline" | "volume";
  dragState: "dragging" | "idle";
  xOffset: number;
  time: number;
  duration: number;
  timelineWidth: number;
};

function getProgress({
  type,
  dragState,
  xOffset,
  time,
  duration,
  timelineWidth,
}: getProgressProps) {
  if (type === "timeline") {
    return dragState === "dragging" ? xOffset / timelineWidth : time / duration;
  }
  if (type === "volume") {
    return dragState === "dragging" ? xOffset / timelineWidth : time;
  }
  return time;
}
