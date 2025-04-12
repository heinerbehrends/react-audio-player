import { useContext, type HTMLAttributes } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { DragButton } from "../Slider/DragButton";
import { Indicator } from "../Slider/Indicator";
import { Container } from "../Slider/Container";
import { VolumeProvider } from "./VolumeProvider";
import { VolumeContext } from "./VolumeContext";
import {
  useHandleVolumeDragStart,
  useOnPointerMoveVolume,
  useOnPointerUpVolume,
  useHandleSetVolume,
  useVolumeAriaAttributes,
} from "./volumeHooks";
import { useHandleSliderKeys } from "../KeyboardControls/keyboardHooks";
import {
  useDragStyles,
  useHandleRef,
  useOnPointerCancel,
  useIndicatorStyles,
} from "../Slider/sliderHooks";
import { useDrag } from "../Slider/useDrag";
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
      <Container {...props} data-type="volume" data-orientation={orientation}>
        {children}
      </Container>
    </VolumeProvider>
  );
}

function VolumeProgress(props: ProgressProps) {
  const context = useContext(VolumeContext);
  const style = useIndicatorStyles({
    context,
    type: "volume",
    style: props.style ?? {},
  });
  return <Indicator {...props} style={style} />;
}

function VolumeSeekButton({ children, ...props }: ButtonProps) {
  const context = useContext(VolumeContext);
  const ariaAttributes = useVolumeAriaAttributes();
  const handleRef = useHandleRef(context);
  const handlePointerDown = useHandleSetVolume(context);
  return (
    <SetRelativeButton
      {...ariaAttributes}
      {...props}
      handleRef={handleRef}
      handlePointerDown={handlePointerDown}
    >
      {children}
    </SetRelativeButton>
  );
}

type VolumeDragButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "type">;

function VolumeDragButton(props: VolumeDragButtonProps) {
  const context = useContext(VolumeContext);
  const handleDragStart = useHandleVolumeDragStart();
  const handleKeyDown = useHandleSliderKeys("volume");
  const handleDragEnd = useOnPointerUpVolume();
  const handleDragMove = useOnPointerMoveVolume(context);
  const handleDragCancel = useOnPointerCancel(context);
  const style = useDragStyles({
    context,
    style: props.style ?? {},
    type: "volume",
  });
  useDrag({
    context,
    onPointerUp: handleDragEnd,
    onPointerMove: handleDragMove,
    onPointerCancel: handleDragCancel,
  });
  return (
    <DragButton
      {...props}
      context={context}
      style={style}
      aria-label="Drag to adjust volume"
      handleDragStart={handleDragStart}
      handleKeyDown={handleKeyDown}
    />
  );
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
