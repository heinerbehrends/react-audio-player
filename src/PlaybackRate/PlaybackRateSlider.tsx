import {
  progressStyles,
  calculateProgressStyle,
} from "../Slider/calculateStyle";
import { SetSliderValue } from "../Slider/SetSliderValue";
import { DragButton } from "../Slider/DragButton";
import { SliderProvider, useSliderContext } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";

function PlaybackRateProgress({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const slider = useSliderContext();
  return (
    <div
      {...props}
      style={{
        ...progressStyles,
        ...calculateProgressStyle(slider),
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

type PlaybackRateSliderProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  maxValue?: number;
  minValue?: number;
  step?: number;
};

function PlaybackRateSliderRoot({
  children,
  maxValue = 4,
  minValue = 0.5,
  step = 0.1,
  style,
  ...props
}: PlaybackRateSliderProps) {
  const slider = useSlider({ mode: "rate", minValue, maxValue, step });

  return (
    <SliderProvider value={slider}>
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
    </SliderProvider>
  );
}

type PlaybackRateSliderComponent = React.FC<PlaybackRateSliderProps> & {
  Background: typeof PlaybackRateBackground;
  Progress: typeof PlaybackRateProgress;
  Set: typeof SetSliderValue;
  Drag: typeof DragButton;
};

export const PlaybackRateSlider = Object.assign(PlaybackRateSliderRoot, {
  Background: PlaybackRateBackground,
  Progress: PlaybackRateProgress,
  Set: SetSliderValue,
  Drag: DragButton,
}) as PlaybackRateSliderComponent;
