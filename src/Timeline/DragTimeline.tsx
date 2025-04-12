import { type HTMLAttributes, useContext } from "react";
import { TimelineContext } from "./TimelineContext";
import { DragButton } from "../Slider/DragButton";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useTimelineDragProps } from "./timelineHooks";

export function TimelineDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TimelineContext);
  const { handleDragStart, handleDragEnd, handleDrag, style } =
    useTimelineDragProps(props.style ?? {});
  const handleKeyDown = useHandleMediaKeys("timeline");
  const handleDragCancel = useOnPointerCancel(context);

  useDrag({
    context,
    onPointerUp: handleDragEnd,
    onPointerMove: handleDrag,
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
