import { HTMLAttributes, useContext } from "react";
import { useHandleSliderKeys } from "../KeyboardControls/keyboardHooks";
import { DragButton } from "../Slider/DragButton";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
import { TimelineContext } from "./TimelineContext";
import {
  useHandleDragStartTimeline,
  useHandleDragEndTimeline,
  useHandleDragTimeline,
  useDragStylesTimeline,
} from "./timelineHooks";

export function TimelineDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TimelineContext);
  const handleDragStart = useHandleDragStartTimeline();
  const handleDragEnd = useHandleDragEndTimeline();
  const handleDragMove = useHandleDragTimeline(context);
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleSliderKeys();
  const style = useDragStylesTimeline({ context, style: props.style ?? {} });

  useDrag({
    context,
    onPointerUp: handleDragEnd,
    onPointerMove: handleDragMove,
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
