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
   * its length from the root's height.
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
        {...props}
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
 * **Give the root a height**, or the track measures zero and the slider is
 * silently inert.
 *
 * Dragging or clicking to zero also mutes, and moving back above zero unmutes.
 * The arrow keys change the volume without unmuting, so the announced value
 * composes both — "Muted, 80%".
 *
 * Live while loading; only an error disables it.
 *
 * The root is a plain `<div>` with no ARIA role: the slider semantics are on
 * `.Control`, which is already named "Volume slider", so a wrapper role and
 * label announced a group with one member and a second name for it (A11). Add
 * your own `role`/`aria-label` if you compose more controls in.
 *
 * Parts carry `data-part`, shared with the other sliders, so scope your CSS.
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
