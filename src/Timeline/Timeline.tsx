import { useContext, type HTMLAttributes } from "react";
import { TimelineProvider } from "./TimelineProvider";
import { TimelineContext } from "./TimelineContext";
import { TimelineDragButton } from "./DragTimeline";
import { SeekTime } from "./SeekTime";
import { useIndicatorStyles, progressStyles } from "../Slider/styleHooks";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

function TimelineProgress(props: ProgressProps) {
  const context = useContext(TimelineContext);
  const style = {
    ...progressStyles,
    ...useIndicatorStyles({
      context,
      style: props.style ?? {},
    }),
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
  Drag: typeof TimelineDragButton;
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

export const Timeline = Object.assign(
  ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <TimelineProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          width: "100%",
          alignItems: "center",
          ...props.style,
        }}
      >
        {children}
      </div>
    </TimelineProvider>
  ),
  {
    Progress: TimelineProgress,
    Seek: SeekTime,
    Drag: TimelineDragButton,
    Background: TimelineBackground,
  }
) as TimelineComponent;
