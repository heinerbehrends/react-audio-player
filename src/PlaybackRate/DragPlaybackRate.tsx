import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { DragButton } from "../Slider/DragButton";

export function DragPlaybackRate(
  props: React.HTMLAttributes<HTMLButtonElement>
) {
  const playbackRateContext = useContext(PlaybackRateContext);
  return (
    <DragButton
      sliderContext={playbackRateContext}
      ariaLabel="Drag to seek"
      {...props}
    />
  );
}
