import { useOnPointerCancel } from "./dragHooks";
import { useDrag } from "./useDrag";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "./dragHooks";
import { calculateDragStyle } from "./calculateStyle";
import { SliderContextType } from "./SliderContext";

interface DragButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
  sliderContext: SliderContextType;
}

export function DragButton({
  ariaLabel,
  sliderContext,
  ...props
}: DragButtonProps) {
  const handleDragStart = useHandleDragStart(sliderContext);
  const handleDragEnd = useHandleDragEnd(sliderContext);
  const handleDrag = useHandleDrag(sliderContext);
  const handleKeyDown = useHandleMediaKeys();
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
