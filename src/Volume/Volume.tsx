import { useContext, type HTMLAttributes } from "react";
import { VolumeProvider } from "./VolumeProvider";
import { VolumeContext } from "./VolumeContext";
import {
  calculateProgressStyle,
  progressStyles,
} from "../Slider/calculateStyle";
import { SetSliderValue } from "../Slider/SetSliderValue";
import { DragButton } from "../Slider/DragButton";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

type VolumeContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
};

function DragVolume(props: React.HTMLAttributes<HTMLButtonElement>) {
  const volumeContext = useContext(VolumeContext);
  return (
    <DragButton
      sliderContext={volumeContext}
      ariaLabel="Drag to adjust volume"
      {...props}
    />
  );
}

function VolumeContainer({
  children,
  orientation = "horizontal",
  ...props
}: VolumeContainerProps) {
  return (
    <VolumeProvider orientation={orientation}>
      <div
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
    </VolumeProvider>
  );
}

function VolumeProgress(props: ProgressProps) {
  const context = useContext(VolumeContext);
  const style = {
    ...progressStyles,
    ...calculateProgressStyle(context),
    ...props.style,
  };
  return <div {...props} style={style} />;
}

type SetVolumeProps = React.HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

function SetVolume({ children, ...props }: SetVolumeProps) {
  const context = useContext(VolumeContext);
  return (
    <SetSliderValue sliderContext={context} {...props}>
      {children}
    </SetSliderValue>
  );
}

type VolumeComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    orientation?: "horizontal" | "vertical";
  }
> & {
  Progress: typeof VolumeProgress;
  Set: typeof SetVolume;
  Drag: typeof DragVolume;
};

function VolumeBackground(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} style={{ ...progressStyles, ...props.style }} />;
}

export const Volume = Object.assign(VolumeContainer as VolumeComponent, {
  Progress: VolumeProgress,
  Background: VolumeBackground,
  Set: SetVolume,
  Drag: DragVolume,
});
