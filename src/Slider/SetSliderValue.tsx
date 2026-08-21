import { useMemo, useRef, useCallback } from "react";
import { useHandleRef, useResizeObserver } from "./useHandleRef";
import { useTimelineAriaAttributes } from "../Timeline/useTimelineAria";
import { useSetValue } from "./dragHooks";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { SliderContextType } from "./SliderContext";
import {
  progressStyles,
  containerStyles,
  buttonStyles,
} from "./calculateStyle";

type SetSliderValueProps = React.HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  sliderContext: SliderContextType;
};

export function SetSliderValue({
  children,
  sliderContext,
  ...props
}: SetSliderValueProps) {
  const ariaAttributes = useTimelineAriaAttributes(sliderContext);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const handleRef = useHandleRef(sliderContext);

  const combinedRef = useCallback(
    (element: HTMLButtonElement | null) => {
      buttonRef.current = element;
      handleRef(element);
    },
    [handleRef],
  );

  useResizeObserver(sliderContext, buttonRef);
  const handlePointerDown = useSetValue(sliderContext);
  const handleKeyDown = useHandleMediaKeys();

  const style = useMemo(
    () => ({
      ...progressStyles,
      ...containerStyles,
      ...buttonStyles,
      ...props.style,
    }),
    [props.style],
  ) satisfies React.CSSProperties;

  return (
    <button
      ref={combinedRef}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...ariaAttributes}
      {...props}
      style={style}
      role="slider"
    >
      {children}
    </button>
  );
}
