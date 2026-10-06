import type { HTMLAttributes } from "react";
import {
  backgroundStyles,
  rootStylesFor,
  sliderCustomProperties,
} from "../Slider/calculateStyle";
import { SliderProgress } from "../Slider/SliderProgress";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderControl } from "../Slider/SliderControl";
import { SliderProvider } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { sliderRootAttributes } from "../Slider/sliderRootAttributes";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

/**
 * The elapsed fill. Give it a background; it fills the root and scales with
 * `--progress`, from a zero-specificity rule that any selector of yours
 * overrides — `width: calc(var(--progress) * 100%)` instead, say (S28).
 *
 * Transitions `transform` over 250ms, linear, from the same rule: the position
 * arrives in `timeupdate` steps (~4 Hz) and would visibly tick without it. The
 * duration drops to `0s` during a drag, where easing reads as the fill lagging
 * the finger. Set `transition-property` to animate something else — a
 * `clip-path` that cuts a waveform rather than scaling it — and the drag still
 * turns it off; `transition: none` removes it (S32).
 */
function TimelineProgress(props: ProgressProps) {
  return <SliderProgress {...props} />;
}

function TimelineBackground(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-part="background"
      {...props}
      style={{
        ...backgroundStyles,
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
        {...sliderRootAttributes(slider)}
        {...props}
        style={{
          ...rootStylesFor(props.hidden),
          ...sliderCustomProperties(slider),
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
 * The scrub bar. Compose it from `.Control` (required) and any of
 * `.Background`, `.Progress` and `.Thumb`, in any order or markup.
 *
 * **Give the root a height.** It has none of its own, and a zero-height track
 * measures zero, which leaves the slider silently inert.
 *
 * There is no `maxValue` — the range is the duration, read from the element.
 * Until one is known, before metadata or on a live stream, the slider is
 * `aria-disabled` and ignores input. `useIsSeekable()` is the same test.
 *
 * The root is a plain `<div>` with no ARIA role: the slider semantics live on
 * `.Control` (A11). Add your own `role="group"` and `aria-label` if you compose
 * other controls in beside it.
 *
 * Carries `data-part="root"`, `data-slider="timeline"`,
 * `data-state="idle|dragging"` and `data-orientation="horizontal"`. All three
 * sliders share their part names, so scope by `data-slider`. Also sets `--progress` (the filled fraction, `0`–`1`)
 * and `--offset` (the thumb position, in `px`) as custom properties, which
 * `.Progress` draws from and your own fills can read.
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
