import { type HTMLAttributes, useContext } from "react";
import { TimelineContext } from "./TimelineContext";
import { DragButton } from "../Slider/DragButton";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDragProps } from "../Slider/dragHooks";

export function TimelineDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TimelineContext);
  const { handleDragStart, handleDragEnd, handleDrag, style } = useDragProps({
    style: props.style ?? {},
    context,
    component: "timeline",
  });
  const handleKeyDown = useHandleMediaKeys("timeline");
  const handleDragCancel = useOnPointerCancel(context);

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
      handleDragStart={handleDragStart}
      handleKeyDown={handleKeyDown}
      context={context}
      aria-label="Drag to seek"
      {...props}
      style={style}
    />
  );
}
