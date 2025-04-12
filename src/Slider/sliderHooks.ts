import { useCallback, useMemo, useRef, useEffect, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { TimelineContextType } from "../Timeline/TimelineContext";
import { VolumeContextType } from "../Volume/VolumeContext";

type UseOffsetArgs = {
  context: VolumeContextType | TimelineContextType;
  type: "timeline" | "volume";
};

export function useOffset({ context, type }: UseOffsetArgs) {
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
      type,
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
    type,
    value,
    sliderLength,
    xyOffset,
    dragState,
    orientation,
    volumeState,
    minValue,
    maxValue,
  ]);
}

type GetOffsetArgs = {
  type: "timeline" | "volume";
  value: number;
  sliderLength: number;
  xyOffset: number;
  minValue?: number;
  maxValue?: number;
  dragState: "dragging" | "idle";
  orientation?: "horizontal" | "vertical";
  volumeState?: "muted" | "low" | "high";
};

function getOffset({
  type,
  value,
  sliderLength,
  xyOffset,
  minValue = 0,
  maxValue = 1,
  dragState,
  orientation = "horizontal",
  volumeState = "high",
}: GetOffsetArgs): number {
  if (type === "volume") {
    if (volumeState === "muted") {
      if (orientation === "horizontal") {
        return 0;
      }
      if (orientation === "vertical") {
        return sliderLength;
      }
    }
  }
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
  context: VolumeContextType | TimelineContextType;
  type: "timeline" | "volume";
  style: React.CSSProperties;
};

export function useDragStyles({
  context,
  type,
  style,
}: UseDragStylesArgs): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset({ context, type });
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
  context: VolumeContextType | TimelineContextType;
  type: "timeline" | "volume";
  style: React.CSSProperties;
};

export function useIndicatorStyles({
  context,
  type,
  style,
}: UseIndicatorStylesArgs) {
  const { orientation, sliderLength } = context;
  const offset = useOffset({ context, type });
  const progress = offset / sliderLength;
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
