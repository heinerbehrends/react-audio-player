import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { Container } from "../Slider/Container";
import { Indicator } from "../Slider/Indicator";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useSetValue, useHandleRef } from "../Slider/sliderHooks";
import { useIndicatorStyles } from "../Slider/styleHooks";
import { DragPlaybackRate } from "./DragPlaybackRate";

type PlaybackRateSliderComponent = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    maxValue?: number;
    minValue?: number;
    step?: number;
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
  const handlePointerDown = useSetValue({
    context,
    component: "playbackRate",
    step: context.step,
  });
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

type PlaybackRateSliderProps = React.HTMLAttributes<HTMLDivElement> & {
  maxValue?: number;
  minValue?: number;
  step?: number;
};

export const PlaybackRateSlider = Object.assign(
  ({
    children,
    maxValue,
    minValue,
    step,
    ...props
  }: PlaybackRateSliderProps) => {
    return (
      <PlaybackRateProvider maxValue={maxValue} minValue={minValue} step={step}>
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
