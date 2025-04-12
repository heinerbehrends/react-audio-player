import { HTMLAttributes, useContext } from "react";
import { useDragStyles, useOnPointerCancel } from "../Slider/sliderHooks";
import { VolumeContext } from "./VolumeContext";
import { useHandleSliderKeys } from "../KeyboardControls/keyboardHooks";
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
  const handleKeyDown = useHandleSliderKeys("volume");
  const style = useDragStyles({
    context,
    style: props.style ?? {},
    type: "volume",
  });
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
      {...props}
      style={style}
    />
  );
}
