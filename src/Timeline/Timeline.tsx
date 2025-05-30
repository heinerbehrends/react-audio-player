import { useContext, type HTMLAttributes } from "react";
import { TimelineProvider } from "./TimelineProvider";
import { TimelineContext } from "./TimelineContext";
import {
  calculateProgressStyle,
  progressStyles,
  containerStyles,
} from "../Slider/calculateStyle";
import { DragButton } from "../Slider/DragButton";
import { SetSliderValue } from "../Slider/SetSliderValue";

function DragTimeline(props: React.HTMLAttributes<HTMLButtonElement>) {
  const timelineContext = useContext(TimelineContext);
  return (
    <DragButton
      sliderContext={timelineContext}
      ariaLabel="Drag or use left and right arrow keys to seek"
      {...props}
    />
  );
}

function SeekTime({
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const timelineContext = useContext(TimelineContext);
  return (
    <SetSliderValue sliderContext={timelineContext} {...props}>
      {children}
    </SetSliderValue>
  );
}

type ProgressProps = HTMLAttributes<HTMLDivElement>;

function TimelineProgress(props: ProgressProps) {
  const context = useContext(TimelineContext);
  const style = {
    ...progressStyles,
    ...calculateProgressStyle(context),
    ...props.style,
  };
  return <div {...props} style={style} />;
}

type TimelineComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
> & {
  Progress: typeof TimelineProgress;
  Background: typeof TimelineBackground;
  Seek: typeof SeekTime;
  Drag: typeof DragTimeline;
};

function TimelineBackground(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        ...progressStyles,
        ...props.style,
      }}
    />
  );
}

const TimelineRoot: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => (
  <TimelineProvider>
    <div
      role="group"
      style={{
        ...containerStyles,
        ...props.style,
      }}
    >
      {children}
    </div>
  </TimelineProvider>
);

export const Timeline: TimelineComponent = TimelineRoot as TimelineComponent;
Timeline.Progress = TimelineProgress;
Timeline.Seek = SeekTime;
Timeline.Drag = DragTimeline;
Timeline.Background = TimelineBackground;
