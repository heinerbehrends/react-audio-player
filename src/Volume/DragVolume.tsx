import { HTMLAttributes, useContext } from "react";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { useDragStyles } from "../Slider/styleHooks";
import { useDragProps } from "../Slider/dragHooks";
import { VolumeContext } from "./VolumeContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDrag } from "../Slider/useDrag";
import { DragButton } from "../Slider/DragButton";

export function VolumeDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(VolumeContext);
  const { handleDragStart, handleDragEnd, handleDrag } = useDragProps({
    context,
    component: "volume",
    style: props.style ?? {},
  });
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("volume");
  const style = useDragStyles({ context, style: props.style ?? {} });
  useDrag({
    context,
    onPointerUp: handleDragEnd as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerMove: handleDrag as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerCancel: handleDragCancel as unknown as () => void,
  });
  return (
    <DragButton
      handleDragStart={handleDragStart}
      handleKeyDown={handleKeyDown}
      context={context}
      aria-label="Drag to adjust volume"
      {...props}
      style={style}
    />
  );
}
