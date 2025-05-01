import { useContext, type HTMLAttributes } from "react";
import { VolumeProvider } from "./VolumeProvider";
import { VolumeContext } from "./VolumeContext";
import { DragVolume } from "./DragVolume";
import { useIndicatorStyles, progressStyles } from "../Slider/styleHooks";
import { SetSliderValue } from "../Slider/SetSliderValue";

type ProgressProps = HTMLAttributes<HTMLDivElement>;

type VolumeContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
};

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
          alignItems: "center",
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
    ...useIndicatorStyles(context),
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
