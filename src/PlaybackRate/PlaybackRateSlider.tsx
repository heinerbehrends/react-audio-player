/* eslint-disable react-refresh/only-export-components --
   The parts attach to the root through a pure `Object.assign`, so that an
   unused compound component tree-shakes; the rule does not read the result as
   a component. */
import { forwardRef } from "react";
import {
  rootStylesFor,
  sliderCustomProperties,
} from "../Slider/calculateStyle";
import { SliderProgress } from "../Slider/SliderProgress";
import { SliderBackground } from "../Slider/SliderBackground";
import { SliderControl } from "../Slider/SliderControl";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderProvider } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { sliderRootAttributes } from "../Slider/sliderRootAttributes";
import { RATE_BOUNDS } from "../AudioElement/sideEffectActions";
import { RATE_MODE } from "../Slider/sliderModes";

type PlaybackRateSliderProps = React.HTMLAttributes<HTMLDivElement> & {
  /** The slider parts: `.Control`, and any of `.Background`, `.Progress` and `.Thumb`. */
  children: React.ReactNode;
  /**
   * The fastest rate the slider reaches, up to `8`.
   *
   * @defaultValue 4
   */
  maxValue?: number;
  /**
   * The slowest rate the slider reaches, down to `0.125`.
   *
   * @defaultValue 0.5
   */
  minValue?: number;
  /**
   * Snaps to a multiple of this. `0` is continuous, with a 0.1 arrow-key step.
   *
   * @defaultValue 0.1
   */
  step?: number;
};

const PlaybackRateSliderRoot = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  PlaybackRateSliderProps
>(function PlaybackRateSlider(
  {
    children,
    maxValue = RATE_BOUNDS.maxValue,
    minValue = RATE_BOUNDS.minValue,
    step = 0.1,
    ...props
  },
  ref,
) {
  const slider = useSlider({ config: RATE_MODE, minValue, maxValue, step });

  return (
    <SliderProvider value={slider}>
      <div
        {...sliderRootAttributes(slider)}
        {...props}
        ref={ref}
        // After the spread, and merged: the root styles carry `position:
        // relative`, which the thumb's `transform` is placed against.
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
});

type PlaybackRateSliderComponent = React.ForwardRefExoticComponent<
  PlaybackRateSliderProps & React.RefAttributes<HTMLDivElement>
> & {
  Background: typeof SliderBackground;
  Progress: typeof SliderProgress;
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

/**
 * A slider for the playback rate, announced as "1.5x". Renders a `<div>` root
 * for `.Control` and any of `.Background`, `.Progress` and `.Thumb`; give it a
 * height, or the slider is silently inert. It stays within
 * `minValue`–`maxValue`; `PlaybackRate.Set` does not, so the two can disagree.
 * Only an error disables it. Carries `data-part="root"`, `data-slider="rate"`,
 * `data-state="idle" | "dragging"` and `data-orientation="horizontal"`, and sets
 * `--progress` and `--offset`.
 */
export const PlaybackRateSlider: PlaybackRateSliderComponent =
  /* @__PURE__ */ Object.assign(PlaybackRateSliderRoot, {
    Background: SliderBackground,
    Progress: SliderProgress,
    Control: SliderControl,
    Thumb: SliderThumb,
  });
