import { useCallback, useContext } from "react";
import type { SliderContext, SliderEvent } from "./SliderContext";
import { getClientXY, calculateValue } from "../Shared/sharedFunctions";
import { PlayerContext } from "../Player/PlayerContext";

export function useHandleDragEnd(context: SliderContext) {
  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction } = context;
      const clientXY = getClientXY(event, context.orientation);
      handleSliderAction({
        type: "DRAG_END",
        ...context,
        clientXY,
      });
    },
    [context]
  );
}

export function useHandleDragStart(context: SliderContext) {
  const { getPlayerState } = useContext(PlayerContext);
  const { unmuteVolumeRef } = getPlayerState();

  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction: handleTimelineAction } = context;
      if (context.component === "volume") {
        unmuteVolumeRef.current = context.value;
      }
      const clientXY = getClientXY(event, context.orientation);

      handleTimelineAction({
        type: "DRAG_START",
        ...context,
        clientXY,
      });
    },
    [context, unmuteVolumeRef]
  );
}

export function useHandleDrag(context: SliderContext) {
  return useCallback(
    function handleDrag(event: SliderEvent) {
      if (context.dragState !== "dragging") {
        return;
      }
      const { handleSliderAction } = context;
      const clientXY = getClientXY(event, context.orientation);
      handleSliderAction({
        type: "DRAG",
        ...context,
        clientXY,
      });
    },
    [context]
  );
}

export function useOnPointerCancel(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction } = context;

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}

export function useSetValue(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction } = context;
  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, context.orientation);
      const value = calculateValue(context);
      handleTimelineAction({
        type: "SET_SLIDER_VALUE",
        ...context,
        clientXY,
      });
      handleTimelineAction({
        type: "UPDATE_UI_VALUE",
        component: "timeline",
        value,
      });
      handleTimelineAction({
        type: "DRAG_START",
        ...context,
      });
    },
    [handleTimelineAction, context]
  );
}
