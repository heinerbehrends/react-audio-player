import { useContext } from "react";
import { TimelineContext } from "./TimelineContext";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "../Slider/dragHooks";
import { useDragStyle } from "../Slider/styleHooks";

export function TimelineDragButton(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const context = useContext(TimelineContext);
  const handleDragStart = useHandleDragStart({
    context,
    component: "timeline",
  });
  const handleDragEnd = useHandleDragEnd({
    context,
    component: "timeline",
  });
  const handleDrag = useHandleDrag({ context, component: "timeline" });
  const handleKeyDown = useHandleMediaKeys("timeline");
  const handleDragCancel = useOnPointerCancel(context);
  const style = useDragStyle({ context });

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
      onPointerUp={handleDragEnd}
      onPointerMove={handleDrag}
      onPointerCancel={handleDragCancel}
      aria-label="Drag to seek"
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
