import { useCallback } from "react";
import type { SliderContextType, SliderEvent } from "./SliderContext";
import { getClientXY } from "../Shared/sharedFunctions";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";

export function useHandleDragEnd(context: SliderContextType) {
  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction, offsetFromMiddle } = context;
      const clientXY = getClientXY(event, context.orientation);
      if (context.dragState !== "dragging") {
        return;
      }
      handleSliderAction({
        type: "DRAG_END",
        ...context,
        clientXY,
        offsetFromMiddle,
      });
    },
    [context],
  );
}

export function useHandleDragStart(context: SliderContextType) {
  const handleSideEffect = useHandleSideEffect();
  return useCallback(
    (event: SliderEvent) => {
      const { handleSliderAction: handleTimelineAction } = context;
      if (context.component === "volume") {
        handleSideEffect({
          type: "UNMUTE",
        });
      }
      const clientXY = getClientXY(event, context.orientation);
      const buttonElement = event.currentTarget;
      const buttonRect = buttonElement.getBoundingClientRect();
      const offsetFromMiddle =
        context.orientation === "horizontal"
          ? clientXY - buttonRect.left - buttonRect.width / 2
          : clientXY - buttonRect.top - buttonRect.height / 2;

      handleTimelineAction({
        type: "DRAG_START",
        ...context,
        clientXY,
        offsetFromMiddle,
      });
      handleSideEffect({
        type: "DRAG_START",
        ...context,
        clientXY,
        offsetFromMiddle,
      });
    },
    [context, handleSideEffect],
  );
}

export function useHandleDrag(context: SliderContextType) {
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
    [context],
  );
}

export function useOnPointerCancel(context: SliderContextType) {
  const { handleSliderAction: handleTimelineAction } = context;

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}

export function useSetValue(context: SliderContextType) {
  const { handleSliderAction } = context;
  const handleSideEffect = useHandleSideEffect();
  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, context.orientation);
      const initialPosition = clientXY;

      function handlePointerMove(moveEvent: PointerEvent) {
        const currentPosition =
          context.orientation === "horizontal"
            ? moveEvent.clientX
            : moveEvent.clientY;

        if (currentPosition !== initialPosition) {
          handleSliderAction({
            type: "DRAG_START",
            ...context,
            clientXY: currentPosition,
          });
          cleanup();
        }
      }

      function cleanup() {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", cleanup);
      }

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", cleanup);

      handleSideEffect({
        type: "SET_SLIDER_VALUE",
        ...context,
        clientXY,
      });

      if (context.component === "volume") {
        handleSideEffect({
          type: "UNMUTE",
        });
      }
    },
    [context, handleSideEffect, handleSliderAction],
  );
}
