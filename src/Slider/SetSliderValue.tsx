import { useMemo } from "react";
import { useHandleRef } from "./hooks/useHandleRef";
import { useTimelineAriaAttributes } from "../Timeline/timelineHooks";
import { useSetValue } from "./hooks/dragHooks";
import { SliderContext } from "./SliderContext";
import {
  progressStyles,
  containerStyles,
  buttonStyles,
} from "./calculateStyle";

type SetSliderValueProps = React.HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  sliderContext: SliderContext;
};

export function SetSliderValue({
  children,
  sliderContext,
  ...props
}: SetSliderValueProps) {
  const ariaAttributes = useTimelineAriaAttributes(sliderContext);
  const handleRef = useHandleRef(sliderContext);
  const handlePointerDown = useSetValue(sliderContext);
  const style = useMemo(
    () => ({
      ...progressStyles,
      ...containerStyles,
      ...buttonStyles,
      ...props.style,
    }),
    [props.style]
  ) satisfies React.CSSProperties;

  return (
    <button
      ref={handleRef}
      onPointerDown={handlePointerDown}
      tabIndex={-1}
      {...ariaAttributes}
      {...props}
      style={style}
      role="slider"
    >
      {children}
    </button>
  );
}
