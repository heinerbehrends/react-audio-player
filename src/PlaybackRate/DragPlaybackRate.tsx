import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { useDrag } from "../Slider/useDrag";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "../Slider/dragHooks";
import { useDragStyle } from "../Slider/styleHooks";

export function DragPlaybackRate(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const context = useContext(PlaybackRateContext);
  const handleDragStart = useHandleDragStart({
    context,
    component: "playbackRate",
  });
  const handleDragEnd = useHandleDragEnd({
    context,
    component: "playbackRate",
  });
  const handleDrag = useHandleDrag({ context, component: "playbackRate" });
  const style = useDragStyle({ context });
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("playbackRate");

  useDrag({
    dragState: context.dragState,
    onPointerUp: handleDragEnd as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerMove: handleDrag as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerCancel: handleDragCancel,
  });

  return (
    <button
      onKeyDown={handleKeyDown}
      onPointerDown={handleDragStart}
      onTouchStart={handleDragStart}
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
