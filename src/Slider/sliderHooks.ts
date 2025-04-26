import { useCallback, useMemo, useRef, useEffect, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
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
type UseOffsetArgs = {
  context: SliderContext;
  getOffset: (args: GetOffsetArgs) => number;
};

export function useOffset({ context, getOffset }: UseOffsetArgs) {
  const {
    xyOffset,
    dragState,
    sliderLength,
    value,
    orientation,
    minValue,
    maxValue,
    step,
  } = context;
  const { volumeState } = useContext(PlayerContext);
  const isStepped = step !== 0;

  return useMemo(() => {
    return getOffset({
      value,
      sliderLength,
      xyOffset,
      minValue,
      maxValue,
      dragState,
      orientation,
      volumeState,
      isStepped,
    });
  }, [
    value,
    sliderLength,
    xyOffset,
    dragState,
    orientation,
    volumeState,
    minValue,
    maxValue,
    getOffset,
    isStepped,
  ]);
}

export type GetOffsetArgs = {
  value: number;
  sliderLength: number;
  xyOffset: number;
  minValue?: number;
  maxValue?: number;
  dragState: "dragging" | "idle";
  orientation?: "horizontal" | "vertical";
  volumeState?: "muted" | "low" | "high";
  isStepped?: boolean;
};

export function getOffset({
  value,
  sliderLength,
  xyOffset,
  minValue = 0,
  maxValue = 1,
  dragState,
  orientation = "horizontal",
  isStepped = false,
}: GetOffsetArgs): number {
  if (dragState === "dragging" && !isStepped) {
    return xyOffset;
  }
  const range = maxValue - minValue;
  const progress = (value - minValue) / range;

  if (orientation === "horizontal") {
    return progress * sliderLength;
  }
  if (orientation === "vertical") {
    return sliderLength - progress * sliderLength;
  }
  return 0;
}

export function useOnPointerCancel(context: SliderContext) {
  const { handleSliderAction } = context;

  return useCallback(() => {
    handleSliderAction({
      type: "CANCEL_DRAG",
    });
  }, [handleSliderAction]);
}

export function useHandleRef(context: SliderContext) {
  const { handleSliderAction, orientation } = context;
  const observerRef = useRef<ResizeObserver>();

  const handleRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }

      observerRef.current = new ResizeObserver(() => {
        const rect = element.getBoundingClientRect();
        handleSliderAction({
          type: "SLIDER_LOADED",
          sliderStart: orientation === "horizontal" ? rect.left : rect.top,
          sliderLength: orientation === "horizontal" ? rect.width : rect.height,
        });
      });

      const rect = element.getBoundingClientRect();
      handleSliderAction({
        type: "SLIDER_LOADED",
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      });

      observerRef.current.observe(element);
    },
    [handleSliderAction, orientation]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return handleRef;
}

type UseDragStylesArgs = {
  context: SliderContext;
  style: React.CSSProperties;
};

export function useDragStyles({
  context,
  style,
}: UseDragStylesArgs): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset({ context, getOffset });
  return useMemo(
    () => ({
      position: "absolute",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      cursor: "grab",
      transform:
        orientation === "horizontal"
          ? `translate(calc(${offset}px - 20px), 0)`
          : `translate(0, calc(${offset}px - 20px))`,
      touchAction: "none",
      ...style,
    }),
    [offset, orientation, style]
  );
}

type UseHandleDragArgs = {
  context: SliderContext;
  type: SliderTypes;
  maxValue?: number;
  minValue?: number;
  step?: number;
};

export function useHandleDrag({ context, type }: UseHandleDragArgs) {
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
      // Create component-specific actions
      if (type === "timeline") {
        handleSliderAction({
          type: "DRAG",
          component: "timeline",
          clientXY,
          duration: maxValue,
          sliderLength,
          sliderStart,
        });
        return;
      }
      if (type === "volume") {
        handleSliderAction({
          type: "DRAG",
          component: "volume",
          clientXY,
          sliderLength,
          sliderStart,
          orientation,
        });
        return;
      }
      if (type === "playbackRate") {
        handleSliderAction({
          type: "DRAG",
          component: "playbackRate",
          clientXY,
          sliderLength,
          sliderStart,
          orientation,
          minValue,
          maxValue,
          step,
        });
        return;
      }
    },
    [
      handleSliderAction,
      type,
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

export type SliderTypes = "timeline" | "volume" | "playbackRate";
export type SliderEvent =
  | React.PointerEvent<HTMLButtonElement>
  | React.TouchEvent<HTMLButtonElement>;

export function useHandleDragStart(context: SliderContext) {
  const { handleSliderAction: handleSliderAction } = context;
  const offset = useOffset({ context, getOffset });
  return useCallback(() => {
    handleSliderAction({ type: "DRAG_START", clientXY: offset });
  }, [handleSliderAction, offset]);
}

export function useHandleDragEnd({
  context,
  component,
}: {
  context: SliderContext;
  component: SliderTypes;
}) {
  const { getPlayerState } = useContext(PlayerContext);
  const {
    handleSliderAction,
    orientation,
    sliderLength,
    sliderStart,
    minValue,
    maxValue,
  } = context;
  const { duration } = getPlayerState();

  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleSliderAction({
        type: "DRAG_END",
        component,
        clientXY,
        minValue,
        maxValue: component === "timeline" ? duration : maxValue,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [
      handleSliderAction,
      duration,
      sliderLength,
      sliderStart,
      orientation,
      component,
      minValue,
      maxValue,
    ]
  );
}

type UseSetValueArgs = {
  context: SliderContext;
  component: SliderTypes;
  step?: number;
};

export function useSetValue({ context, component, step = 0 }: UseSetValueArgs) {
  const {
    sliderStart,
    sliderLength,
    handleSliderAction,
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

      handleSliderAction({
        type: "CHANGE_VALUE",
        value,
        component,
      });
    },
    [
      handleSliderAction,
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

type UseIndicatorStylesArgs = {
  context: SliderContext;
  style: React.CSSProperties;
  type?: SliderTypes;
};

export function useIndicatorStyles({
  context,
  style,
  type = "timeline",
}: UseIndicatorStylesArgs): React.CSSProperties {
  const progress = useProgress({ context, getOffset, type });
  return useMemo(
    () => ({
      transform: `scaleX(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: "left",
      ...style,
    }),
    [progress, style]
  );
}

type UseProgressArgs = {
  context: SliderContext;
  getOffset: (args: GetOffsetArgs) => number;
  type?: SliderTypes;
};

function useProgress({
  context,
  getOffset,
  type = "timeline",
}: UseProgressArgs): number {
  const { orientation } = context;
  const isVerticalVolume = type === "volume" && orientation === "vertical";
  const offset = useOffset({ context, getOffset });
  const progress = offset / context.sliderLength;
  return isVerticalVolume ? 1 - progress : progress;
}

type UseSliderDragPropsArgs = {
  style: React.CSSProperties;
  context: SliderContext;
  component: SliderTypes;
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
    type: component,
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
