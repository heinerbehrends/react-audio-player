import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "../Slider/dragHooks";
import { useDragStyle } from "../Slider/styleHooks";
import { SliderContext } from "./SliderContext";

interface DragButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
  sliderContext: SliderContext;
}

export function DragButton({
  ariaLabel,
  sliderContext,
  ...props
}: DragButtonProps) {
  const handleDragStart = useHandleDragStart(sliderContext);
  const handleDragEnd = useHandleDragEnd(sliderContext);
  const handleDrag = useHandleDrag(sliderContext);
  const handleKeyDown = useHandleMediaKeys(sliderContext.component);
  const handleDragCancel = useOnPointerCancel(sliderContext);
  const style = useDragStyle(sliderContext);

  useDrag({
    dragState: sliderContext.dragState,
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
      aria-label={ariaLabel}
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
