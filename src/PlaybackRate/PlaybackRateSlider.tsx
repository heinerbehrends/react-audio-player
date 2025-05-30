import { useContext } from "react";
import { PlaybackRateContext } from "./PlaybackRateContext";
import { PlaybackRateProvider } from "./PlaybackRateProvider";
import { SetSliderValue } from "../Slider/SetSliderValue";
import { progressStyles } from "../Slider/calculateStyle";

type PlaybackRateSliderComponent = React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    maxValue?: number;
    minValue?: number;
    step?: number;
  }
> & {
  Background: typeof PlaybackRateBackground;
  Set: typeof Set;
  Drag: typeof Drag;
};

import { DragButton } from "../Slider/DragButton";

function Drag(props: React.HTMLAttributes<HTMLButtonElement>) {
  const playbackRateContext = useContext(PlaybackRateContext);
  return (
    <DragButton
      sliderContext={playbackRateContext}
      ariaLabel="Drag or use > and < and ] and [ keys to adjust playback rate"
      {...props}
    />
  );
}

function Set({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(PlaybackRateContext);
  return (
    <SetSliderValue sliderContext={context} {...props}>
      {children}
    </SetSliderValue>
  );
}

type PlaybackRateSliderProps = React.HTMLAttributes<HTMLDivElement> & {
  maxValue?: number;
  minValue?: number;
  step?: number;
};

function PlaybackRateBackground({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      style={{
        ...progressStyles,
        ...style,
      }}
    />
  );
}

export const PlaybackRateSlider = Object.assign(
  ({
    children,
    maxValue = 4,
    minValue = 0.5,
    step = 0.1,
    style,
    ...props
  }: PlaybackRateSliderProps) => {
    return (
      <PlaybackRateProvider maxValue={maxValue} minValue={minValue} step={step}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr",
            width: "100%",
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </PlaybackRateProvider>
    );
  },
  {
    Background: PlaybackRateBackground,
    Set,
    Drag,
  }
) as PlaybackRateSliderComponent;
