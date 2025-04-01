import { type HTMLAttributes } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { DragButton } from "../Slider/DragButton";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { VolumeProvider } from "./VolumeProvider";

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "type">;
type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type"> & {
  children: React.ReactNode;
};

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
      <Container {...props} data-type="volume">
        {children}
      </Container>
    </VolumeProvider>
  );
}

function VolumeProgress(props: ProgressProps) {
  return <Indicator {...props} type="volume" />;
}

function VolumeSeekButton({ children, ...props }: ButtonProps) {
  return (
    <SetRelativeButton {...props} type="volume">
      {children}
    </SetRelativeButton>
  );
}

type VolumeDragButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type">;

function VolumeDragButton(props: VolumeDragButtonProps) {
  return <DragButton {...props} type="volume" />;
}

type VolumeComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    orientation?: "horizontal" | "vertical";
  }
> & {
  Progress: typeof VolumeProgress;
  Set: typeof VolumeSeekButton;
  Drag: typeof VolumeDragButton;
};

export const Volume = Object.assign(VolumeContainer as VolumeComponent, {
  Progress: VolumeProgress,
  Set: VolumeSeekButton,
  Drag: VolumeDragButton,
});
