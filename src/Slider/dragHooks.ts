import { useCallback, useContext } from "react";
import { SliderContext } from "./SliderContext";
import type { SliderEvent } from "./sliderHooks";
import { getClientXY } from "../Shared/sharedFunctions";
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
    (event: SliderEvent) => {
      const { handleSliderAction } = context;
      const clientXY = getClientXY(event, context.orientation);
      if (context.dragState !== "dragging") {
        return;
      }
      handleSliderAction({
        type: "DRAG",
        ...context,
        clientXY,
      });
    },
    [context]
  );
}
