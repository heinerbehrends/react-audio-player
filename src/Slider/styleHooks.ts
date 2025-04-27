import { useContext, useMemo } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { SliderContext } from "./SliderContext";
import { SliderComponent } from "./sliderHooks";

type UseOffsetArgs = {
  context: SliderContext;
};
export function useOffset({ context }: UseOffsetArgs) {
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

type UseDragStylesArgs = {
  context: SliderContext;
  style: React.CSSProperties;
};

export function useDragStyles({
  context,
  style,
}: UseDragStylesArgs): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset({ context });
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
  context: SliderContext;
  style: React.CSSProperties;
  type?: SliderComponent;
};

export function useIndicatorStyles({
  context,
  style,
  type = "timeline",
}: UseIndicatorStylesArgs): React.CSSProperties {
  const progress = useProgress({ context, type });
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
  type?: SliderComponent;
};

function useProgress({ context, type = "timeline" }: UseProgressArgs): number {
  const { orientation } = context;
  const isVerticalVolume = type === "volume" && orientation === "vertical";
  const offset = useOffset({ context });
  const progress = offset / context.sliderLength;
  return isVerticalVolume ? 1 - progress : progress;
}
