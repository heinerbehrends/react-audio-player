import { type HTMLAttributes, useContext } from "react";
import { SetRelativeButton } from "../Slider/SetRelativeButton";
import { useHandleRef } from "../Slider/sliderHooks";
import { TimelineContext } from "./TimelineContext";
import { useTimelineAriaAttributes } from "../Timeline/timelineHooks";
import { useSetValue } from "../Slider/sliderHooks";

type SeekTimeProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function SeekTime({ children, ...props }: SeekTimeProps) {
  const context = useContext(TimelineContext);
  const ariaAttributes = useTimelineAriaAttributes();
  const handleRef = useHandleRef(context);
  const handlePointerDown = useSetValue({ context, component: "timeline" });
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
