import { useContext } from "react";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import {
  useHandleDrag,
  useHandleDragEnd,
  useHandleDragStart,
} from "../Slider/dragHooks";
import { VolumeContext } from "./VolumeContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDrag } from "../Slider/useDrag";
import { useDragStyle } from "../Slider/styleHooks";

export function VolumeDragButton(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const context = useContext(VolumeContext);
  const handleDragStart = useHandleDragStart({
    context,
    component: "volume",
  });
  const handleDragEnd = useHandleDragEnd({
    context,
    component: "volume",
  });
  const handleDrag = useHandleDrag({ context, component: "volume" });
  const style = useDragStyle({ context });
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("volume");

  useDrag({
    dragState: context.dragState,
    onPointerUp: handleDragEnd as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerMove: handleDrag as unknown as (
      event: PointerEvent | TouchEvent
    ) => void,
    onPointerCancel: handleDragCancel as unknown as () => void,
  });
  return (
    <button
      onKeyDown={handleKeyDown}
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onPointerMove={handleDrag}
      onPointerCancel={handleDragCancel}
      aria-label="Drag to adjust volume"
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
