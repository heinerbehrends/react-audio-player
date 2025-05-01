import { useContext } from "react";
import { VolumeContext } from "./VolumeContext";
import { DragButton } from "../Slider/DragButton";

export function DragVolume(props: React.HTMLAttributes<HTMLButtonElement>) {
  const volumeContext = useContext(VolumeContext);
  return (
    <DragButton
      sliderContext={volumeContext}
      ariaLabel="Drag to adjust volume"
      {...props}
    />
  );
}
