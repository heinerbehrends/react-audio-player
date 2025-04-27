import { useMemo, useCallback } from "react";
import { SliderContext } from "./SliderContext";
import {
  SliderComponent as SliderComponents,
  SliderEvent,
} from "./sliderHooks";
import { useDragStyles, useOffset } from "./styleHooks";
import { getClientXY } from "./useDrag";

type UseSliderDragPropsArgs = {
  style: React.CSSProperties;
  context: SliderContext;
  component: SliderComponents;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isStepped?: boolean;
};

export function useDragProps({
  style,
  context,
  component,
  minValue = 0,
  maxValue = 1,
  step = 0,
}: UseSliderDragPropsArgs) {
  const handleDragStart = useHandleDragStart(context);
  const handleDragEnd = useHandleDragEnd({ context, component });
  const handleDrag = useHandleDrag({
    context,
    component: component,
    minValue,
    maxValue,
    step,
  });
  const dragStyles = useDragStyles({ context, style });

  return useMemo(
    () => ({
      handleDragStart,
      handleDragEnd,
      handleDrag,
      style: dragStyles,
    }),
    [handleDragStart, handleDragEnd, handleDrag, dragStyles]
  );
}

function useHandleDragEnd({
  context,
  component,
}: {
  context: SliderContext;
  component: SliderComponents;
}) {
  const {
    handleSliderAction,
    orientation,
    sliderLength,
    sliderStart,
    minValue,
    maxValue,
  } = context;

  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleSliderAction({
        type: "DRAG_END",
        component,
        clientXY,
        minValue,
        maxValue,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [
      handleSliderAction,
      sliderLength,
      sliderStart,
      orientation,
      component,
      minValue,
      maxValue,
    ]
  );
}

function useHandleDragStart(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction } = context;
  const offset = useOffset({ context });
  return useCallback(() => {
    handleTimelineAction({ type: "DRAG_START", clientXY: offset });
  }, [handleTimelineAction, offset]);
}

type UseHandleDragArgs = {
  context: SliderContext;
  component: SliderComponents;
  maxValue?: number;
  minValue?: number;
  step?: number;
};

function useHandleDrag({ context, component }: UseHandleDragArgs) {
  const {
    handleSliderAction,
    orientation,
    sliderLength,
    sliderStart,
    dragState,
    maxValue,
    minValue,
    step,
  } = context;

  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, orientation);
      if (dragState !== "dragging") {
        return;
      }
      handleSliderAction({
        type: "DRAG",
        component,
        clientXY,
        maxValue,
        sliderLength,
        sliderStart,
        orientation,
        minValue,
        step,
      });
    },
    [
      handleSliderAction,
      component,
      orientation,
      sliderLength,
      sliderStart,
      maxValue,
      minValue,
      dragState,
      step,
    ]
  );
}
