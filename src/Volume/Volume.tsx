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
import { SliderControl } from "../Slider/SliderControl";
import { SliderThumb } from "../Slider/SliderThumb";
import { SliderProvider } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";
import { sliderRootAttributes } from "../Slider/sliderRootAttributes";
import { VOLUME_MODE } from "../Slider/sliderModes";
import { useIsVolumeAvailable } from "../store/volumeAvailable";

type VolumeProps = HTMLAttributes<HTMLDivElement> & {
  /** The slider parts: `.Control`, and any of `.Background`, `.Progress` and `.Thumb`. */
  children: React.ReactNode;
  /**
   * The axis the slider runs along. A vertical slider fills from the bottom and
   * takes its length from the root's height.
   *
   * @defaultValue "horizontal"
   */
  orientation?: "horizontal" | "vertical";
};

const VolumeContainer = /* @__PURE__ */ forwardRef<HTMLDivElement, VolumeProps>(
  function Volume({ children, orientation = "horizontal", ...props }, ref) {
    // iOS accepts the write and ignores it, so the slider would move nothing (D3).
    const slider = useSlider({
      config: VOLUME_MODE,
      disabled: !useIsVolumeAvailable(),
      orientation,
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

type VolumeComponent = React.ForwardRefExoticComponent<
  VolumeProps & React.RefAttributes<HTMLDivElement>
> & {
  Progress: typeof SliderProgress;
  Background: typeof SliderBackground;
  Control: typeof SliderControl;
  Thumb: typeof SliderThumb;
};

/**
 * The volume slider, `0`–`1`. Renders a `<div>` root for `.Control` and any of
 * `.Background`, `.Progress` and `.Thumb`; give it a height, or the slider is
 * silently inert. Reaching zero mutes. A drag or click above zero unmutes; the
 * arrow keys do not, so the announced value includes the mute: "Muted, 80%".
 * Disabled on iOS, where the browser ignores volume writes. Carries
 * `data-part="root"`, `data-slider="volume"`, `data-state="idle" | "dragging"`
 * and `data-orientation`, and sets `--progress` and `--offset`.
 */
export const Volume: VolumeComponent = /* @__PURE__ */ Object.assign(
  VolumeContainer,
  {
    Progress: SliderProgress,
    Background: SliderBackground,
    Control: SliderControl,
    Thumb: SliderThumb,
  },
);
