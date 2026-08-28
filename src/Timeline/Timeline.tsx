import type { HTMLAttributes } from "react";
import {
  calculateProgressStyle,
  progressStyles,
  containerStyles,
} from "../Slider/calculateStyle";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderControl } from "../Slider/SliderControl";
import { SliderProvider, useSliderContext } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

/**
 * The elapsed fill. Scaled with `transform`, so give it a background and let it
 * fill the root — width and height are the library's.
 *
 * Carries `transition: transform 250ms linear`, because the position arrives in
 * `timeupdate` steps (~4 Hz) and would visibly tick without it; linear rather
 * than eased so the fill advances at the rate the audio does. It is dropped for
 * the duration of a drag, where easing reads as the fill lagging the finger.
 *
 * Override or remove it through `style`, which is merged last:
 * `style={{ transition: "none" }}`.
 */
function TimelineProgress(props: ProgressProps) {
  const slider = useSliderContext();
  const style = {
    ...progressStyles,
    ...calculateProgressStyle(slider),
    ...(slider.dragState === "dragging"
      ? null
      : { transition: "transform 250ms linear" }),
    ...props.style,
  };
  return <div data-part="progress" {...props} style={style} />;
}

function TimelineBackground(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-part="background"
      {...props}
      style={{
        ...progressStyles,
        ...props.style,
      }}
    />
  );
}

type TimelineProps = HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  /**
   * Snap seeks to a multiple of this many seconds. Omitted or `0` seeks
   * continuously, which is the default.
   *
   * @defaultValue 0
   */
  step?: number;
};

const TimelineRoot: React.FC<TimelineProps> = ({
  children,
  step,
  ...props
}) => {
  const slider = useSlider({
    mode: "seek",
    ...(step === undefined ? {} : { step }),
  });

  return (
    <SliderProvider value={slider}>
      <div
        data-part="root"
        {...props}
        role="group"
        style={{
          ...containerStyles,
          ...props.style,
        }}
      >
        {children}
      </div>
    </SliderProvider>
  );
};

type TimelineComponent = React.FC<TimelineProps> & {
  Progress: typeof TimelineProgress;
  Background: typeof TimelineBackground;
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

/**
 * The scrub bar. Compose it from `.Control` (required), and any of
 * `.Background`, `.Progress` and `.Thumb`, in whatever order and markup you
 * like.
 *
 * **Give the root a height.** It has none of its own, and a zero-height track
 * measures zero — which leaves the slider silently inert.
 *
 * There is no `maxValue`: the range is the track's duration, read from the
 * element. Until one is known — before metadata, or on a live stream — the
 * slider is marked `aria-disabled` and ignores input, since it cannot name a
 * position. `useIsSeekable()` is the same predicate.
 *
 * Every part carries a `data-part` attribute (`root`, `control`, `progress`,
 * `background`, `thumb`) so plain CSS can reach it. All three sliders share
 * those names, so scope your selectors to your own container.
 *
 * @example
 * ```jsx
 * <Timeline className="timeline">
 *   <Timeline.Background />
 *   <Timeline.Progress />
 *   <Timeline.Control />
 *   <Timeline.Thumb />
 * </Timeline>
 * ```
 */
export const Timeline: TimelineComponent = TimelineRoot as TimelineComponent;
Timeline.Progress = TimelineProgress;
Timeline.Control = SliderControl;
Timeline.Thumb = SliderThumb;
Timeline.Background = TimelineBackground;
