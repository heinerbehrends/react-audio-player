import { useOnPointerCancel } from "./dragHooks";
import { useDrag } from "./useDrag";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "./dragHooks";
import { calculateDragStyle } from "./calculateStyle";
import { SliderContextType } from "./SliderContext";

interface DragButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  sliderContext: SliderContextType;
}

export function DragButton({ sliderContext, ...props }: DragButtonProps) {
  const handleDragStart = useHandleDragStart(sliderContext);
  const handleDragEnd = useHandleDragEnd(sliderContext);
  const handleDrag = useHandleDrag(sliderContext);
  const handleDragCancel = useOnPointerCancel(sliderContext);
  const style = calculateDragStyle(sliderContext);
  useDrag({
    dragState: sliderContext.dragState,
    onPointerUp: handleDragEnd as unknown as (
      event: PointerEvent | TouchEvent,
    ) => void,
    onPointerMove: handleDrag as unknown as (
      event: PointerEvent | TouchEvent,
    ) => void,
    onPointerCancel: handleDragCancel,
  });

  // The slider semantics and the keyboard handler live on SetSliderValue, which
  // is always present. This thumb is a pointer-only affordance: hidden from
  // assistive technology and out of the tab order, so there is exactly one
  // element per slider that announces a value and responds to arrow keys.
  return (
    <button
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onPointerMove={handleDrag}
      onPointerCancel={handleDragCancel}
      tabIndex={-1}
      aria-hidden="true"
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
