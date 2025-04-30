import { useContext, type HTMLAttributes } from "react";
import { Indicator, IndicatorBackground } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { TimelineProvider } from "./TimelineProvider";
import { TimelineContext } from "./TimelineContext";
import { TimelineDragButton } from "./DragTimeline";
import { SeekTime } from "./SeekTime";
import { useIndicatorStyles } from "../Slider/styleHooks";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

function TimelineProgress(props: ProgressProps) {
  const context = useContext(TimelineContext);
  const style = useIndicatorStyles({
    context,
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

type TimelineComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
> & {
  Progress: typeof TimelineProgress;
  Background: typeof IndicatorBackground;
  Seek: typeof SeekTime;
  Drag: typeof TimelineDragButton;
};

export const Timeline = Object.assign(
  ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <TimelineProvider>
      <Container {...props}>{children}</Container>
    </TimelineProvider>
  ),
  {
    Progress: TimelineProgress,
    Seek: SeekTime,
    Drag: TimelineDragButton,
    Background: IndicatorBackground,
  }
) as TimelineComponent;
