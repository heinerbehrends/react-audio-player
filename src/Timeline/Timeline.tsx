import { type HTMLAttributes } from "react";
import { SetRelativeButton } from "../TimelineVolume/SetRelativeButton";
import { DragButton } from "../TimelineVolume/DragButton";
import { Indicator } from "../TimelineVolume/Indicator";
import { Container } from "../TimelineVolume/Container";

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
  SeekButton: typeof TimelineSeekButton;
  DragButton: typeof TimelineDragButton;
};

export const Timeline = Object.assign(
  ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <Container {...props} data-type="timeline">
      {children}
    </Container>
  ),
  {
    Progress: TimelineProgress,
    SeekButton: TimelineSeekButton,
    DragButton: TimelineDragButton,
  }
) as TimelineComponent;

// export default Timeline;
