import { useContext, type HTMLAttributes, memo, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
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
  const { orientation } = useContext(switchContext[type]);

  const progress = useProgress(type);

  const style = useMemo(
    () => ({
      transform:
        orientation === "horizontal"
          ? `scaleX(${progress})`
          : `scaleY(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: orientation === "horizontal" ? "left" : "bottom",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      ...props.style,
    }),
    [progress, props.style, orientation]
  );

  return <div {...props} style={style} />;
});

function useProgress(type: "timeline" | "volume") {
  const {
    dragState,
    xyOffset: xOffset,
    value: time,
    sliderLength,
    orientation,
  } = useContext(switchContext[type]);
  const { volumeState, getPlayerState } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const isDragging = dragState === "dragging";
  // const upperLimit = type === "timeline" ? duration : 1;
  if (type === "volume" && volumeState === "muted") {
    return 0;
  }
  if (type === "timeline") {
    return isDragging ? xOffset / sliderLength : time / duration;
  }
  if (type === "volume") {
    const dragVolume = xOffset / sliderLength;

    return isDragging
      ? orientation === "horizontal"
        ? dragVolume
        : 1 - dragVolume
      : time;
  }
  return time;
}
