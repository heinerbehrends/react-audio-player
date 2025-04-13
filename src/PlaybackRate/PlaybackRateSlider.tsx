import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { Container } from "../Timeline/TimelineContainer";
import { DragPlaybackRate } from "./DragPlaybackRate";
import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { Indicator } from "../Slider/Indicator";
import {
  useHandleSeek,
  useTimelineIndicatorStyles,
} from "../Timeline/timelineHooks";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useHandleRef } from "../Slider/sliderHooks";

type PlaybackRateSlider = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
  } & {
    Progress: typeof PlaybackRateProgress;
    SetPlaybackRate: typeof SetPlaybackRate;
    Drag: typeof DragPlaybackRate;
  }
>;

function SetPlaybackRate({ children }: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(PlaybackRateContext);
  const handleRef = useHandleRef(context);
  const handlePointerDown = useHandleSeek();
  return (
    <SetRelativeButton
      handleRef={handleRef}
      handlePointerDown={handlePointerDown}
    >
      {children}
    </SetRelativeButton>
  );
}

function PlaybackRateProgress(props: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(PlaybackRateContext);
  const style = useTimelineIndicatorStyles({
    context,
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

export const PlaybackRateSlider = Object.assign(
  ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
      <PlaybackRateProvider>
        <Container {...props}>{children}</Container>
      </PlaybackRateProvider>
    );
  },
  {
    Progress: PlaybackRateProgress,
    Set: SetPlaybackRate,
    Drag: DragPlaybackRate,
  }
) as PlaybackRateSlider;
