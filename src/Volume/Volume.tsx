import type { HTMLAttributes } from "react";
import {
  calculateProgressStyle,
  progressStyles,
} from "../Slider/calculateStyle";
import { SetSliderValue } from "../Slider/SetSliderValue";
import { DragButton } from "../Slider/DragButton";
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
  return <div {...props} style={style} />;
}

function VolumeBackground(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} style={{ ...progressStyles, ...props.style }} />;
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
        role="group"
        aria-label="Volume controls"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "1fr",
          width: "100%",
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
  Set: typeof SetSliderValue;
  Drag: typeof DragButton;
};

export const Volume = Object.assign(VolumeContainer as VolumeComponent, {
  Progress: VolumeProgress,
  Background: VolumeBackground,
  Set: SetSliderValue,
  Drag: DragButton,
});
