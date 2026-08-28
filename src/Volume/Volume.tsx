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

// Property assignment, not `Object.assign`: the call is a side-effecting
// expression a bundler cannot drop, which would pull the whole library into a
// consumer who imported one component.
export const Volume = VolumeContainer as VolumeComponent;
Volume.Progress = VolumeProgress;
Volume.Background = VolumeBackground;
Volume.Control = SliderControl;
Volume.Thumb = SliderThumb;
