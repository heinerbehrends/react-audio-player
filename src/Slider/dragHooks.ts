import { useMemo, useCallback, useContext } from "react";
import { SliderContext } from "./SliderContext";
import { SliderComponent, SliderEvent } from "./sliderHooks";
import { useDragStyles } from "./styleHooks";
import { getClientXY } from "./useDrag";
import { PlayerContext } from "../Player/PlayerContext";

type UseSliderDragPropsArgs = {
  style: React.CSSProperties;
  context: SliderContext;
  component: SliderComponent;
};

export function useDragProps({
  style,
  context,
  component,
}: UseSliderDragPropsArgs) {
  const handleDragStart = useHandleDragStart({ context, component });
  const handleDragEnd = useHandleDragEnd({ context, component });
  const handleDrag = useHandleDrag({
    context,
    component: component,
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
  component: SliderComponent;
}) {
  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction } = context;
      const clientXY = getClientXY(event, context.orientation);
      handleSliderAction({
        type: "DRAG_END",
        component,
        clientXY,
        minValue: context.minValue,
        maxValue: context.maxValue,
        sliderLength: context.sliderLength,
        sliderStart: context.sliderStart,
        orientation: context.orientation,
        step: context.step,
      });
    },
    [context, component]
  );
}

function useHandleDragStart({
  context,
  component,
}: {
  context: SliderContext;
  component: SliderComponent;
}) {
  const { getPlayerState } = useContext(PlayerContext);
  const { unmuteVolumeRef } = getPlayerState();

  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction: handleTimelineAction } = context;
      if (component === "volume") {
        unmuteVolumeRef.current = context.value;
      }
      const clientXY = getClientXY(event, context.orientation);
      handleTimelineAction({
        type: "DRAG_START",
        clientXY,
        sliderLength: context.sliderLength,
        sliderStart: context.sliderStart,
        orientation: context.orientation,
        minValue: context.minValue,
        maxValue: context.maxValue,
        step: context.step,
      });
    },
    [context, component, unmuteVolumeRef]
  );
}

type UseHandleDragArgs = {
  context: SliderContext;
  component: SliderComponent;
};

function useHandleDrag({ context, component }: UseHandleDragArgs) {
  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction } = context;
      const clientXY = getClientXY(event, context.orientation);
      if (context.dragState !== "dragging") {
        return;
      }
      handleSliderAction({
        type: "DRAG",
        component,
        clientXY,
        maxValue: context.maxValue,
        sliderLength: context.sliderLength,
        sliderStart: context.sliderStart,
        orientation: context.orientation,
        minValue: context.minValue,
        step: context.step,
      });
    },
    [context, component]
  );
}
