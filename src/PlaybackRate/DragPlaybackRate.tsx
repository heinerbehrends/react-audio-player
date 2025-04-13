import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { useTimelineDragProps } from "../Timeline/timelineHooks";
import { DragButton } from "../Slider/DragButton";
import { useDrag } from "../Slider/useDrag";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";

export function DragPlaybackRate(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const context = useContext(PlaybackRateContext);
  const { handleDragStart, handleDragEnd, handleDrag, style } =
    useTimelineDragProps({ style: props.style ?? {}, context });
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("playbackRate");
  useDrag({
    context,
    onPointerUp: handleDragEnd,
    onPointerMove: handleDrag,
    onPointerCancel: handleDragCancel,
  });

  return (
    <DragButton
      handleKeyDown={handleKeyDown}
      handleDragStart={handleDragStart}
      context={context}
      {...props}
      style={style}
    />
  );
}
