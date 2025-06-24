import { useRef, useCallback, useEffect } from "react";
import { SliderContextType } from "./SliderContext";

export function useHandleRef(context: SliderContextType) {
  const { handleSliderAction, orientation } = context;
  const handleRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      handleSliderAction({
        type: "SLIDER_LOADED",
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      });
      return element;
    },
    [handleSliderAction, orientation],
  );
  return handleRef;
}

export function useResizeObserver(
  context: SliderContextType,
  buttonRef: React.RefObject<HTMLButtonElement>,
) {
  const { handleSliderAction, orientation } = context;
  const observerRef = useRef<ResizeObserver>();

  useEffect(() => {
    observerRef.current = new ResizeObserver(() => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      handleSliderAction({
        type: "SLIDER_LOADED",
        sliderStart:
          orientation === "horizontal" ? buttonRect.left : buttonRect.top,
        sliderLength:
          orientation === "horizontal" ? buttonRect.width : buttonRect.height,
      });
    });

    if (buttonRef.current) {
      observerRef.current?.observe(buttonRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleSliderAction, orientation, buttonRef]);
}
