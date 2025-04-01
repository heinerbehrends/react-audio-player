import { type HTMLAttributes } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { DragButton } from "../Slider/DragButton";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { TimelineProvider } from "./TimelineProvider";

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "type">;
type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type"> & {
  children: React.ReactNode;
};

function TimelineProgress(props: ProgressProps) {
  return <Indicator {...props} type="timeline" />;
}

function TimelineSeekButton({ children, ...props }: ButtonProps) {
  return (
    <SetRelativeButton {...props} type="timeline">
      {children}
    </SetRelativeButton>
  );
}

function TimelineDragButton(
  props: Omit<HTMLAttributes<HTMLButtonElement>, "type">
) {
  return <DragButton {...props} type="timeline" />;
}

type TimelineComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> & {
  Progress: typeof TimelineProgress;
  Seek: typeof TimelineSeekButton;
  Drag: typeof TimelineDragButton;
};

export const Timeline = Object.assign(
  ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <TimelineProvider>
      <Container {...props} data-type="timeline">
        {children}
      </Container>
    </TimelineProvider>
  ),
  {
    Progress: TimelineProgress,
    Seek: TimelineSeekButton,
    Drag: TimelineDragButton,
  }
) as TimelineComponent;

// export default Timeline;
