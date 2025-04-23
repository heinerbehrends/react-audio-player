import { HTMLAttributes, useContext } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useHandleRef, useSetValue } from "../Slider/sliderHooks";
import { VolumeContext } from "./VolumeContext";
import { useVolumeAriaAttributes } from "./volumeHooks";

type SetVolumeProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function SetVolume({ children, ...props }: SetVolumeProps) {
  const context = useContext(VolumeContext);
  const ariaAttributes = useVolumeAriaAttributes();
  const handleRef = useHandleRef(context);
  const handlePointerDown = useSetValue({ context, component: "volume" });
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
