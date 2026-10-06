import type { HTMLAttributes } from "react";
import {
  backgroundStyles,
  rootStylesFor,
  sliderCustomProperties,
} from "../Slider/calculateStyle";
import { SliderProgress } from "../Slider/SliderProgress";
import { SliderControl } from "../Slider/SliderControl";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderProvider } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { sliderRootAttributes } from "../Slider/sliderRootAttributes";

function VolumeBackground(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-part="background"
      {...props}
      style={{ ...backgroundStyles, ...props.style }}
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
}

type VolumeComponent = React.FC<VolumeProps> & {
  Progress: typeof SliderProgress;
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
 * `.Control`, which is already named "Volume slider" (A11). Add your own
 * `role`/`aria-label` if you compose more controls in.
 *
 * Carries `data-part="root"`, `data-slider="volume"`,
 * `data-state="idle|dragging"` and `data-orientation="horizontal|vertical"` —
 * the axis, where a root-level layout rule can read it; `aria-orientation` is
 * on `.Control`, a child. Also sets `--progress` and `--offset` as custom
 * properties, which `.Progress` draws from and your own fills can read.
 */
// Property assignment, not `Object.assign`: the call is a side-effecting
// expression a bundler cannot drop, so a consumer importing one component got
// the whole library (P1-a). Used for every compound root here.
export const Volume = VolumeContainer as VolumeComponent;
Volume.Progress = SliderProgress;
Volume.Background = VolumeBackground;
Volume.Control = SliderControl;
Volume.Thumb = SliderThumb;
