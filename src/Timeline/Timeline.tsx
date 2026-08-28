import type { HTMLAttributes } from "react";
import {
  calculateProgressStyle,
  progressStyles,
  containerStyles,
} from "../Slider/calculateStyle";
import { DragButton } from "../Slider/DragButton";
import { SetSliderValue } from "../Slider/SetSliderValue";
import { SliderProvider, useSliderContext } from "../Slider/SliderContext";
import { useSlider } from "../Slider/useSlider";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

/**
 * The one element still on `currentTime` rather than `currentSecond`, so the
 * fill arrives in `timeupdate` steps (~4 Hz) and would visibly tick without
 * smoothing. The duration matches that cadence and the easing is linear, so the
 * fill advances at the rate the audio does instead of easing into each step.
 *
 * Off during a drag: the value then updates at pointer rate, and any easing
 * reads as the thumb lagging the finger. `props.style` is spread last, so a
 * consumer can override or drop the transition entirely.
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
  return <div {...props} style={style} />;
}

function TimelineBackground(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
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
  step?: number;
};

/**
 * Configuration over `useSlider`. The max is not a prop — it is the duration,
 * which seek mode reads from the store.
 */
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
  Seek: typeof SetSliderValue;
  Drag: typeof DragButton;
};

export const Timeline: TimelineComponent = TimelineRoot as TimelineComponent;
Timeline.Progress = TimelineProgress;
Timeline.Seek = SetSliderValue;
Timeline.Drag = DragButton;
Timeline.Background = TimelineBackground;
