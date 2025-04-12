import { HTMLAttributes, useContext } from "react";
import { useDragStyles, useOnPointerCancel } from "../Slider/sliderHooks";
import { VolumeContext } from "./VolumeContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDrag } from "../Slider/useDrag";
import {
  useHandleDragEndVolume,
  useHandleDragVolume,
  useHandleVolumeDragStart,
} from "./volumeHooks";
import { DragButton } from "../Slider/DragButton";

export function VolumeDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(VolumeContext);
  const handleDragStart = useHandleVolumeDragStart();
  const handleDragEnd = useHandleDragEndVolume();
  const handleDragMove = useHandleDragVolume(context);
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleMediaKeys("volume");
  const style = useDragStyles({ context, style: props.style ?? {} });
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
      aria-label="Drag to adjust volume"
      {...props}
      style={style}
    />
  );
}
