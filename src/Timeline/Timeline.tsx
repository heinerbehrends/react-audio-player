import { useContext, type HTMLAttributes } from "react";
import { TimelineContext } from "./TimelineContext";
import { PlayerContext } from "../Player/PlayerContext";
import { useUpdateTime } from "./useUpdateTime";
import { TimelineSeekButton } from "./TimelineSeekButton";
import { TimelineDragButton } from "./TimelineDragButton";

function TimelineProgress(props: HTMLAttributes<HTMLDivElement>) {
  const { dragState, xOffset, time, timelineWidth } =
    useContext(TimelineContext);
  const { element } = useContext(PlayerContext);

  const duration = element?.duration ?? 1;
  const progress =
    dragState === "dragging" ? xOffset / timelineWidth : time / duration;

  useUpdateTime();

  return (
    <div
      {...props}
      style={{
        transform: `scaleX(${progress})`,
        width: "100%",
        height: "100%",
        transformOrigin: "left",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        ...props.style,
      }}
      role="progressbar"
      aria-valuenow={time}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-label="audio progress"
    />
  );
}

function TimelineContainer({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      {...props}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        width: "100%",
        ...props.style,
      }}
    >
      {children}
    </div>
  );
}

function TimelineBackground(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

type TimelineComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> & {
  Background: typeof TimelineBackground;
  Progress: typeof TimelineProgress;
  SeekButton: typeof TimelineSeekButton;
  DragButton: typeof TimelineDragButton;
};

const Timeline = TimelineContainer as TimelineComponent;

Timeline.Background = TimelineBackground;
Timeline.Progress = TimelineProgress;
Timeline.SeekButton = TimelineSeekButton;
Timeline.DragButton = TimelineDragButton;

export default Timeline;
