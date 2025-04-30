import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useSetValue, useHandleRef } from "../Slider/sliderHooks";
import { DragPlaybackRate } from "./DragPlaybackRate";
import { progressStyles } from "../Slider/styleHooks";

type PlaybackRateSliderComponent = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    maxValue?: number;
    minValue?: number;
    step?: number;
  }
> & {
  Background: typeof PlaybackRateBackground;
  Set: typeof Set;
  Drag: typeof DragPlaybackRate;
};

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

function PlaybackRateBackground(props: React.HTMLAttributes<HTMLDivElement>) {
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
      </PlaybackRateProvider>
    );
  },
  {
    Background: PlaybackRateBackground,
    Set,
    Drag: DragPlaybackRate,
  }
) as PlaybackRateSliderComponent;
