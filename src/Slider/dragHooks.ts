import { useCallback, useContext } from "react";
import { SliderContext } from "./SliderContext";
import { SliderComponent, SliderEvent } from "./sliderHooks";
import { getClientXY } from "../Shared/sharedFunctions";
import { PlayerContext } from "../Player/PlayerContext";

export function useHandleDragEnd({
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
        ...context,
        clientXY,
      });
    },
    [context, component]
  );
}

export function useHandleDragStart({
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
        ...context,
        clientXY,
      });
    },
    [context, component, unmuteVolumeRef]
  );
}

type UseHandleDragArgs = {
  context: SliderContext;
  component: SliderComponent;
};

export function useHandleDrag({ context, component }: UseHandleDragArgs) {
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
        ...context,
        clientXY,
      });
    },
    [context, component]
  );
}
