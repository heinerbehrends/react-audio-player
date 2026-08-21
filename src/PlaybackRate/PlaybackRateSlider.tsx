import { usePlaybackRateContext } from "./PlaybackRateContext";
import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { SetSliderValue } from "../Slider/SetSliderValue";
import {
  progressStyles,
  calculateProgressStyle,
} from "../Slider/calculateStyle";

type PlaybackRateSliderComponent = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    maxValue?: number;
    minValue?: number;
    step?: number;
  }
> & {
  Background: typeof PlaybackRateBackground;
  Progress: typeof PlaybackRateProgress;
  Set: typeof Set;
  Drag: typeof Drag;
};

import { DragButton } from "../Slider/DragButton";

function Drag(props: React.HTMLAttributes<HTMLButtonElement>) {
  const playbackRateContext = usePlaybackRateContext();
  return <DragButton sliderContext={playbackRateContext} {...props} />;
}

function Set({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const context = usePlaybackRateContext();
  return (
    <SetSliderValue sliderContext={context} {...props}>
      {children}
    </SetSliderValue>
  );
}

type PlaybackRateSliderProps = React.HTMLAttributes<HTMLDivElement> & {
  maxValue?: number;
  minValue?: number;
  step?: number;
};

function PlaybackRateProgress({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = usePlaybackRateContext();
  return (
    <div
      {...props}
      style={{
        ...progressStyles,
        ...calculateProgressStyle(context),
        ...style,
      }}
    />
  );
}

function PlaybackRateBackground({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        ...progressStyles,
        ...style,
      }}
    />
  );
}

export const PlaybackRateSlider = Object.assign(
  ({
    children,
    maxValue = 4,
    minValue = 0.5,
    step = 0.1,
    style,
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
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </PlaybackRateProvider>
    );
  },
  {
    Background: PlaybackRateBackground,
    Progress: PlaybackRateProgress,
    Set,
    Drag,
  },
) as PlaybackRateSliderComponent;
