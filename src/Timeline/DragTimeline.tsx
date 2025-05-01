import { useContext } from "react";
import { TimelineContext } from "./TimelineContext";
import { DragButton } from "../Slider/DragButton";

export function DragTimeline(props: React.HTMLAttributes<HTMLButtonElement>) {
  const timelineContext = useContext(TimelineContext);
  return (
    <DragButton
      sliderContext={timelineContext}
      ariaLabel="Drag to seek"
      {...props}
    />
  );
}
