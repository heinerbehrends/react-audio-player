import { useContext, type HTMLAttributes, memo, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";

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
  const { volumeState } = useContext(PlayerContext);
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
        volumeState,
      }),
    [type, dragState, xOffset, time, duration, sliderLength, volumeState]
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

  return <div {...props} style={style} />;
});

type getProgressProps = {
  type: "timeline" | "volume";
  dragState: "dragging" | "idle";
  xOffset: number;
  time: number;
  duration: number;
  sliderLength: number;
  volumeState: "muted" | "low" | "high";
};

function getProgress({
  type,
  dragState,
  xOffset,
  time,
  duration,
  sliderLength,
  volumeState,
}: getProgressProps) {
  if (type === "volume" && volumeState === "muted") {
    return 0;
  }
  if (type === "timeline") {
    return dragState === "dragging" ? xOffset / sliderLength : time / duration;
  }
  if (type === "volume") {
    return dragState === "dragging" ? xOffset / sliderLength : time;
  }
  return time;
}
