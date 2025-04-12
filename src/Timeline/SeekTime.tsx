import { type HTMLAttributes, useContext } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useHandleRef } from "../Slider/sliderHooks";
import { TimelineContext } from "./TimelineContext";
import { useTimelineAriaAttributes, useHandleSeek } from "./timelineHooks";

type SeekTimeProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function SeekTime({ children, ...props }: SeekTimeProps) {
  const context = useContext(TimelineContext);
  const ariaAttributes = useTimelineAriaAttributes();
  const handleRef = useHandleRef(context);
  const handlePointerDown = useHandleSeek(context);
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
