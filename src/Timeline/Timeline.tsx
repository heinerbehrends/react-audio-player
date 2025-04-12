import { useContext, type HTMLAttributes } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { DragButton } from "../Slider/DragButton";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { TimelineProvider } from "./TimelineProvider";
import { TimelineContext } from "./TimelineContext";
import {
  useHandleDragStartTimeline,
  useHandleDragEndTimeline,
  useHandleDragTimeline,
  useHandleSeek,
  useDragStylesTimeline,
  useTimelineAriaAttributes,
} from "./timelineHooks";
import { useHandleSliderKeys } from "../KeyboardControls/keyboardHooks";
import { useDrag } from "../Slider/useDrag";
import {
  useHandleRef,
  useOnPointerCancel,
  useIndicatorStyles,
} from "../Slider/sliderHooks";

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "type">;
type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type"> & {
  children: React.ReactNode;
};

function TimelineProgress(props: ProgressProps) {
  const context = useContext(TimelineContext);
  const style = useIndicatorStyles({
    context,
    type: "timeline",
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

function TimelineSeekButton({ children, ...props }: ButtonProps) {
  const context = useContext(TimelineContext);
  const ariaAttributes = useTimelineAriaAttributes();
  const handleRef = useHandleRef(context);
  const handlePointerDown = useHandleSeek(context);
  return (
    <SetRelativeButton
      {...ariaAttributes}
      {...props}
      handleRef={handleRef}
      handlePointerDown={handlePointerDown}
    >
      {children}
    </SetRelativeButton>
  );
}

function TimelineDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TimelineContext);
  const handleDragStart = useHandleDragStartTimeline();
  const handleDragEnd = useHandleDragEndTimeline();
  const handleDragMove = useHandleDragTimeline(context);
  const handleDragCancel = useOnPointerCancel(context);
  const handleKeyDown = useHandleSliderKeys();
  const style = useDragStylesTimeline({ context, style: props.style ?? {} });
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
      aria-label="Drag to seek"
      {...props}
      style={style}
    />
  );
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
