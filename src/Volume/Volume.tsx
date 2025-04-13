import { useContext, type HTMLAttributes } from "react";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { VolumeProvider } from "./VolumeProvider";
import { VolumeContext } from "./VolumeContext";
import { VolumeDragButton } from "./DragVolume";
import { SetVolume } from "./SetVolume";
import { useIndicatorStyles } from "../Slider/sliderHooks";
import { getVolumeOffset } from "./volumeHooks";
import { PlayerContext } from "../Player/PlayerContext";

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
      <Container {...props} data-type="volume" data-orientation={orientation}>
        {children}
      </Container>
    </VolumeProvider>
  );
}

function VolumeProgress(props: ProgressProps) {
  const context = useContext(VolumeContext);
  const { volumeState } = useContext(PlayerContext);
  const style = useIndicatorStyles({
    context,
    style: props.style ?? {},
    getOffset: getVolumeOffset(volumeState),
    type: "volume",
    dragState: context.dragState,
  });
  return <Indicator {...props} style={style} />;
}

type VolumeComponent = React.FC<
  HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    orientation?: "horizontal" | "vertical";
  }
> & {
  Progress: typeof VolumeProgress;
  Set: typeof SetVolume;
  Drag: typeof VolumeDragButton;
};

export const Volume = Object.assign(VolumeContainer as VolumeComponent, {
  Progress: VolumeProgress,
  Set: SetVolume,
  Drag: VolumeDragButton,
});
