/* eslint-disable react-refresh/only-export-components --
   The parts attach to the root through a pure `Object.assign`, so that an
   unused compound component tree-shakes; the rule does not read the result as
   a component. */
import { forwardRef, type HTMLAttributes } from "react";
import {
  rootStylesFor,
  sliderCustomProperties,
} from "../Slider/calculateStyle";
import { SliderProgress } from "../Slider/SliderProgress";
import { SliderBackground } from "../Slider/SliderBackground";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderControl } from "../Slider/SliderControl";
import { SliderProvider } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { sliderRootAttributes } from "../Slider/sliderRootAttributes";
import { SEEK_MODE } from "../Slider/sliderModes";

type TimelineProps = HTMLAttributes<HTMLDivElement> & {
  /** The slider parts: `.Control`, and any of `.Background`, `.Progress` and `.Thumb`. */
  children?: React.ReactNode;
  /**
   * Snaps seeks and arrow-key steps to a multiple of this many seconds. `0`
   * seeks continuously, with a 5-second arrow step.
   *
   * @defaultValue 0
   */
  step?: number;
};

const TimelineRoot = /* @__PURE__ */ forwardRef<HTMLDivElement, TimelineProps>(
  function Timeline({ children, step, ...props }, ref) {
    const slider = useSlider({
      config: SEEK_MODE,
      ...(step === undefined ? {} : { step }),
    });

    return (
      <SliderProvider value={slider}>
        <div
          {...sliderRootAttributes(slider)}
          {...props}
          ref={ref}
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
  },
);

type TimelineComponent = React.ForwardRefExoticComponent<
  TimelineProps & React.RefAttributes<HTMLDivElement>
> & {
  Progress: typeof SliderProgress;
  Background: typeof SliderBackground;
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

/**
 * The scrub bar. Renders a `<div>` root for `.Control` and any of
 * `.Background`, `.Progress` and `.Thumb`. Give it a height: a zero-height
 * track measures zero and the slider is silently inert. Its range is the
 * duration, so it is disabled until one is known and on a live stream. Carries
 * `data-part="root"`, `data-slider="timeline"`, `data-state="idle" | "dragging"`
 * and `data-orientation="horizontal"`, and sets `--progress` (`0`–`1`) and
 * `--offset` (the thumb position, in `px`).
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
export const Timeline: TimelineComponent = /* @__PURE__ */ Object.assign(
  TimelineRoot,
  {
    Progress: SliderProgress,
    Control: SliderControl,
    Thumb: SliderThumb,
    Background: SliderBackground,
  },
);
