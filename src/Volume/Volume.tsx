import type { HTMLAttributes } from "react";
import {
  calculateProgressStyle,
  progressStyles,
  rootStyles,
} from "../Slider/calculateStyle";
import { SliderControl } from "../Slider/SliderControl";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderProvider, useSliderContext } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

function VolumeProgress(props: ProgressProps) {
  const slider = useSliderContext();
  const style = {
    ...progressStyles,
    ...calculateProgressStyle(slider),
    ...props.style,
  };
  return <div data-part="progress" {...props} style={style} />;
}

function VolumeBackground(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-part="background"
      {...props}
      style={{ ...progressStyles, ...props.style }}
    />
  );
}

type VolumeProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  /**
   * Which axis the slider runs along. Vertical fills from the bottom and takes
   * its length from the root's height, so a vertical slider needs an explicit
   * height rather than a width.
   *
   * @defaultValue "horizontal"
   */
  orientation?: "horizontal" | "vertical";
};

function VolumeContainer({
  children,
  orientation = "horizontal",
  ...props
}: VolumeProps) {
  const slider = useSlider({ mode: "volume", orientation });

  return (
    <SliderProvider value={slider}>
      <div
        data-part="root"
        aria-label="Volume controls"
        {...props}
        role="group"
        style={{
          ...rootStyles,
          ...props.style,
        }}
      >
        {children}
      </div>
    </SliderProvider>
  );
}

type VolumeComponent = React.FC<VolumeProps> & {
  Progress: typeof VolumeProgress;
  Background: typeof VolumeBackground;
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

/**
 * The volume slider, on a 0–1 range. Compose it from `.Control` (required) and
 * any of `.Background`, `.Progress` and `.Thumb`.
 *
 * **Give the root a height** — it has none of its own, and a zero-height track
 * measures zero, which leaves the slider silently inert.
 *
 * Dragging or clicking to zero also mutes, and moving back above zero unmutes;
 * the arrow keys change the volume without unmuting. The announced value
 * composes the two — "Muted, 80%" — because the element keeps them separate.
 *
 * Live while the track is loading: `volume` is settable before metadata. Only an
 * error disables it.
 *
 * Parts carry `data-part` (`root`, `control`, `progress`, `background`,
 * `thumb`), shared with the other two sliders, so scope your CSS.
 */
// Property assignment, not `Object.assign`: the call is a side-effecting
// expression a bundler cannot drop, so a consumer importing one component got
// the whole library. Measured under P1-a; the same pattern is used for every
// compound root here.
export const Volume = VolumeContainer as VolumeComponent;
Volume.Progress = VolumeProgress;
Volume.Background = VolumeBackground;
Volume.Control = SliderControl;
Volume.Thumb = SliderThumb;
