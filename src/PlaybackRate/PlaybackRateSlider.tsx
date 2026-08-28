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
  /**
   * Fastest rate the slider reaches. The arrow keys and `End` clamp to it, and
   * it is what the slider announces as its maximum.
   *
   * @defaultValue 4
   */
  maxValue?: number;
  /**
   * Slowest rate the slider reaches.
   *
   * @defaultValue 0.5
   */
  minValue?: number;
  /**
   * Snap to a multiple of this. `0` is continuous, and also makes the arrow keys
   * fall back to a 0.1 step, since an arrow needs a discrete one.
   *
   * @defaultValue 0.1
   */
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

/**
 * A slider for the playback rate. Compose it from `.Control` (required) and any
 * of `.Background`, `.Progress` and `.Thumb`.
 *
 * **Give the root a height**, or the track measures zero and the slider is
 * silently inert.
 *
 * The slider clamps to its own `minValue`/`maxValue`. `PlaybackRate.Set`
 * deliberately does not — it names an explicit rate — so the two can disagree if
 * you use both; the element itself accepts 0–16.
 *
 * The rate announces as a multiplier ("1.5x"). Live while the track is loading:
 * `playbackRate` is settable before metadata.
 */
export const PlaybackRateSlider =
  PlaybackRateSliderRoot as PlaybackRateSliderComponent;
PlaybackRateSlider.Background = PlaybackRateBackground;
PlaybackRateSlider.Progress = PlaybackRateProgress;
PlaybackRateSlider.Control = SliderControl;
PlaybackRateSlider.Thumb = SliderThumb;
