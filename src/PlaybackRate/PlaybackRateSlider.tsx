import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { Container } from "../Slider/Container";
import { Indicator } from "../Slider/Indicator";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { DragPlaybackRate } from "./DragPlaybackRate";
import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { useIndicatorStyles, useSetValue } from "../Slider/sliderHooks";
import { useHandleRef } from "../Slider/sliderHooks";

type PlaybackRateSliderComponent = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
  }
> & {
  Progress: typeof Progress;
  Set: typeof Set;
  Drag: typeof DragPlaybackRate;
};

function Progress(props: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(PlaybackRateContext);
  const style = useIndicatorStyles({
    context,
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

function Set({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(PlaybackRateContext);
  const handleRef = useHandleRef(context);
  const handlePointerDown = useSetValue({ context, component: "playbackRate" });
  return (
    <SetRelativeButton
      handleRef={handleRef}
      handlePointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </SetRelativeButton>
  );
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
    Progress,
    Set,
    Drag: DragPlaybackRate,
  }
) as PlaybackRateSliderComponent;
