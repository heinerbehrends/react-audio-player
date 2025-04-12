import { type HTMLAttributes, memo } from "react";

type IndicatorProps = HTMLAttributes<HTMLDivElement> & {
  style: React.CSSProperties;
};

export const Indicator = memo(function Indicator({
  style,
  ...props
}: IndicatorProps) {
  return <div {...props} style={style} />;
});

// function useProgress(context: VolumeContextType | TimelineContextType) {
//   const {
//     dragState,
//     xyOffset: xOffset,
//     value: time,
//     sliderLength,
//     orientation,
//   } = context;
//   const { volumeState, getPlayerState } = useContext(PlayerContext);
//   const { duration } = getPlayerState();
//   const isDragging = dragState === "dragging";
//   // const upperLimit = type === "timeline" ? duration : 1;
//   if (type === "volume" && volumeState === "muted") {
//     return 0;
//   }
//   if (type === "timeline") {
//     return isDragging ? xOffset / sliderLength : time / duration;
//   }
//   if (type === "volume") {
//     const dragVolume = xOffset / sliderLength;

//     return isDragging
//       ? orientation === "horizontal"
//         ? dragVolume
//         : 1 - dragVolume
//       : time;
//   }
//   return time;
// }
