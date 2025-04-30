import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { DragButton } from "../Slider/DragButton";
import { useDrag } from "../Slider/useDrag";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDragProps } from "../Slider/dragHooks";

export function DragPlaybackRate(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const context = useContext(PlaybackRateContext);
  const { handleDragStart, handleDragEnd, handleDrag, style } = useDragProps({
    style: props.style ?? {},
    context,
    component: "playbackRate",
  });
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("playbackRate");

  useDrag({
    context,
    onPointerUp: handleDragEnd as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerMove: handleDrag as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerCancel: handleDragCancel,
  });

  return (
    <DragButton
      handleKeyDown={handleKeyDown}
      handleDragStart={handleDragStart}
      {...props}
      style={style}
    />
  );
}
