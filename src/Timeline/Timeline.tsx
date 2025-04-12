import { useContext, type HTMLAttributes } from "react";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { TimelineProvider } from "./TimelineProvider";
import { TimelineContext } from "./TimelineContext";
import { TimelineDragButton } from "./DragTimeline";
import { SeekTime } from "./SeekTime";
import { useTimelineIndicatorStyles } from "./timelineHooks";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

function TimelineProgress(props: ProgressProps) {
  const context = useContext(TimelineContext);
  const style = useTimelineIndicatorStyles({
    context,
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

type TimelineComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> & {
  Progress: typeof TimelineProgress;
  Seek: typeof SeekTime;
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
    Seek: SeekTime,
    Drag: TimelineDragButton,
  }
) as TimelineComponent;
