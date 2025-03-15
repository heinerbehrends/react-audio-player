import { useContext, type HTMLAttributes, memo, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { useUpdateTime } from "../Timeline/useUpdateTime";

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

type TimelineProgressProps = HTMLAttributes<HTMLDivElement> & {
  type: "timeline" | "volume";
};

export const Indicator = memo(function Indicator({
  type,
  ...props
}: TimelineProgressProps) {
  const { dragState, xOffset, time, timelineWidth } = useContext(
    switchContext[type]
  );
  const { audioElement } = useContext(AudioContext);
  const duration = type === "timeline" ? audioElement?.duration ?? 1 : 1;

  const progress = useMemo(
    () =>
      getProgress({
        type,
        dragState,
        xOffset,
        time,
        duration,
        timelineWidth,
      }),
    [type, dragState, xOffset, time, duration, timelineWidth]
  );

  const style = useMemo(
    () => ({
      transform: `scaleX(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: "left",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      ...props.style,
    }),
    [progress, props.style]
  );

  useUpdateTime();

  const { minutes, seconds } = minutesAndSeconds(time);
  return (
    <div
      {...props}
      style={style}
      role="progressbar"
      aria-valuetext={`${
        type === "timeline"
          ? `${minutes} minutes ${seconds} seconds`
          : `${Math.round(time * 100)}%`
      }`}
      aria-valuenow={time}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-label={type === "timeline" ? "audio progress" : "volume level"}
    />
  );
});

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

function minutesAndSeconds(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return { minutes, seconds };
}
