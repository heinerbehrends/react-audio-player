import { useContext, type HTMLAttributes, memo, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";

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
  const { dragState, xOffset, time, sliderLength } = useContext(
    switchContext[type]
  );
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const duration = type === "timeline" ? audioElement?.duration ?? 1 : 1;

  const progress = useMemo(
    () =>
      getProgress({
        type,
        dragState,
        xOffset,
        time,
        duration,
        sliderLength,
      }),
    [type, dragState, xOffset, time, duration, sliderLength]
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

  const ariaValueText = useMemo(() => {
    const { minutes, seconds } = minutesAndSeconds(time);
    if (type === "timeline") {
      return `${minutes} minutes ${seconds} seconds`;
    }
    if (type === "volume") {
      return `${Math.round(time * 100)}%`;
    }
  }, [type, time]);

  const ariaLabel = useMemo(() => {
    if (type === "timeline") {
      return "audio progress";
    }
    return "volume level";
  }, [type]);

  return (
    <div
      {...props}
      style={style}
      role="progressbar"
      aria-valuetext={ariaValueText}
      aria-valuenow={time}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-label={ariaLabel}
    />
  );
});

type getProgressProps = {
  type: "timeline" | "volume";
  dragState: "dragging" | "idle";
  xOffset: number;
  time: number;
  duration: number;
  sliderLength: number;
};

function getProgress({
  type,
  dragState,
  xOffset,
  time,
  duration,
  sliderLength,
}: getProgressProps) {
  if (type === "timeline") {
    return dragState === "dragging" ? xOffset / sliderLength : time / duration;
  }
  if (type === "volume") {
    return dragState === "dragging" ? xOffset / sliderLength : time;
  }
  return time;
}

function minutesAndSeconds(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return { minutes, seconds };
}
