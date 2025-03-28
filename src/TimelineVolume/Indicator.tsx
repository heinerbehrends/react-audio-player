import { useContext, type HTMLAttributes, memo, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
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
  const progress = useProgress(type);

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

function useProgress(type: "timeline" | "volume") {
  const { dragState, xOffset, time, sliderLength } = useContext(
    switchContext[type]
  );
  const { volumeState, getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  // const upperLimit = type === "timeline" ? duration : 1;
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
