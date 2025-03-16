import { type HTMLAttributes } from "react";
import { SetRelativeButton } from "../TimelineVolume/SetRelativeButton";
import { DragButton } from "../TimelineVolume/DragButton";
import { Indicator } from "../TimelineVolume/Indicator";
import { Container } from "../TimelineVolume/Container";

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "type">;
type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type"> & {
  children: React.ReactNode;
};

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
  HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> & {
  Progress: typeof VolumeProgress;
  SeekButton: typeof VolumeSeekButton;
  DragButton: typeof VolumeDragButton;
};

export const Volume = Object.assign(Container as VolumeComponent, {
  Progress: VolumeProgress,
  SeekButton: VolumeSeekButton,
  DragButton: VolumeDragButton,
});
