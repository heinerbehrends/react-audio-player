import { HTMLAttributes, useContext } from "react";
import { useOnPointerCancel } from "../Slider/sliderHooks";
import { VolumeContext } from "./VolumeContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDrag } from "../Slider/useDrag";
import {
  useDragStylesVolume,
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
  const style = useDragStylesVolume(props.style ?? {});
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
