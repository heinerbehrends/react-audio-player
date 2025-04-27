import { useCallback, useRef, useEffect, useContext } from "react";
import { getClientXY } from "./useDrag";
import {
  calculateSteppedValue,
  calculateValue,
} from "../Shared/sharedFunctions";
import {
  isSliderAction,
  isSliderSideEffect,
  type SliderProviderAction,
  type SliderContext,
} from "./SliderContext";
import { handleSideEffect } from "../AudioElement/handleSideEffect";
import { AudioContext } from "../AudioElement/AudioContext";

export function useOnPointerCancel(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction } = context;

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}

export function useHandleRef(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction, orientation } = context;
  const observerRef = useRef<ResizeObserver>();

  const handleRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }

      observerRef.current = new ResizeObserver(() => {
        const rect = element.getBoundingClientRect();
        handleTimelineAction({
          type: "SLIDER_LOADED",
          sliderStart: orientation === "horizontal" ? rect.left : rect.top,
          sliderLength: orientation === "horizontal" ? rect.width : rect.height,
        });
      });

      const rect = element.getBoundingClientRect();
      handleTimelineAction({
        type: "SLIDER_LOADED",
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      });

      observerRef.current.observe(element);
    },
    [handleTimelineAction, orientation]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return handleRef;
}

export type SliderTypes = "timeline" | "volume" | "playbackRate";
export type SliderEvent =
  | React.PointerEvent<HTMLButtonElement>
  | React.TouchEvent<HTMLButtonElement>;

type UseSetValueArgs = {
  context: SliderContext;
  component: SliderTypes;
  step?: number;
};

export function useSetValue({ context, component, step = 0 }: UseSetValueArgs) {
  const {
    sliderStart,
    sliderLength,
    handleSliderAction: handleTimelineAction,
    orientation,
    minValue,
    maxValue,
  } = context;
  return useCallback(
    (event: SliderEvent) => {
      const xyOffset = getClientXY(event, orientation);
      const value = step
        ? calculateSteppedValue({
            value: calculateValue({
              xyOffset,
              sliderStart,
              sliderLength,
              minValue,
              maxValue,
              orientation,
            }),
            minValue,
            maxValue,
            step,
          })
        : calculateValue({
            xyOffset,
            sliderStart,
            sliderLength,
            minValue,
            maxValue,
            orientation,
          });

      handleTimelineAction({
        type: "CHANGE_VALUE",
        value,
        component,
      });
    },
    [
      handleTimelineAction,
      sliderStart,
      sliderLength,
      orientation,
      minValue,
      maxValue,
      component,
      step,
    ]
  );
}

export function useHandleAction({
  dispatch,
  action,
}: {
  dispatch: React.Dispatch<SliderProviderAction>;
  action: SliderProviderAction;
}) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  if (isSliderSideEffect(action)) {
    handleSideEffect(action, audioElement);
  }
  if (isSliderAction(action)) {
    dispatch(action);
  }
}
