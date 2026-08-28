import {
  progressStyles,
  calculateProgressStyle,
  rootStyles,
} from "../Slider/calculateStyle";
import { SliderControl } from "../Slider/SliderControl";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderProvider, useSliderContext } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { RATE_BOUNDS } from "../AudioElement/sideEffectActions";

function PlaybackRateProgress({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const slider = useSliderContext();
  return (
    <div
      data-part="progress"
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
      data-part="background"
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
  maxValue = RATE_BOUNDS.maxValue,
  minValue = RATE_BOUNDS.minValue,
  step = 0.1,
  style,
  ...props
}: PlaybackRateSliderProps) {
  const slider = useSlider({ mode: "rate", minValue, maxValue, step });

  return (
    <SliderProvider value={slider}>
      <div
        data-part="root"
        style={{
          ...rootStyles,
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
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

export const PlaybackRateSlider =
  PlaybackRateSliderRoot as PlaybackRateSliderComponent;
PlaybackRateSlider.Background = PlaybackRateBackground;
PlaybackRateSlider.Progress = PlaybackRateProgress;
PlaybackRateSlider.Control = SliderControl;
PlaybackRateSlider.Thumb = SliderThumb;
