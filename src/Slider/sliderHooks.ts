import { useCallback, useMemo, useRef, useEffect, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import type { TimelineContextType } from "../Timeline/TimelineContext";
import type { VolumeContextType } from "../Volume/VolumeContext";
import type { GetVolumeOffsetArgs } from "../Volume/volumeHooks";

type UseOffsetArgs = {
  context: VolumeContextType | TimelineContextType;
  getOffset: (args: GetOffsetArgs | GetVolumeOffsetArgs) => number;
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
  } = context;
  const { volumeState } = useContext(PlayerContext);

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
};

export function getOffset({
  value,
  sliderLength,
  xyOffset,
  minValue = 0,
  maxValue = 1,
  dragState,
  orientation = "horizontal",
}: GetOffsetArgs): number {
  if (dragState === "dragging") {
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

export function useOnPointerCancel(
  context: TimelineContextType | VolumeContextType
) {
  const { handleTimelineAction } = context;

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}

export function useHandleRef(context: TimelineContextType | VolumeContextType) {
  const { handleTimelineAction, orientation } = context;
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

type UseDragStylesArgs = {
  context: TimelineContextType | VolumeContextType;
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

type UseIndicatorStylesArgs = {
  context: TimelineContextType | VolumeContextType;
  style: React.CSSProperties;
  type?: "volume" | "timeline";
  getOffset: (args: GetOffsetArgs | GetVolumeOffsetArgs) => number;
  dragState: "dragging" | "idle";
  // orientation?: "horizontal" | "vertical";
};

export function useIndicatorStyles({
  context,
  style,
  type,
  getOffset,
  dragState,
}: UseIndicatorStylesArgs): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset({ context, getOffset });
  let progress = offset / context.sliderLength;

  if (
    type === "volume" &&
    orientation === "vertical" &&
    dragState === "dragging"
  ) {
    progress = 1 - progress;
  }

  return useMemo(
    () => ({
      transform:
        orientation === "horizontal"
          ? `scaleX(${progress})`
          : `scaleY(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: orientation === "horizontal" ? "left" : "bottom",
      ...style,
    }),
    [progress, orientation, style]
  );
}
