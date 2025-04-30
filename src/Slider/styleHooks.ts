import { useContext, useMemo } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { SliderContext } from "./SliderContext";
import { SliderComponent } from "./sliderHooks";
import { getOffset } from "../Shared/sharedFunctions";

type UseOffsetArgs = {
  context: SliderContext;
};
export function useOffset({ context }: UseOffsetArgs) {
  const { volumeState } = useContext(PlayerContext);

  return useMemo(() => {
    const {
      clientXY: xyOffset,
      dragState,
      sliderLength,
      value,
      orientation,
      minValue,
      maxValue,
      step,
    } = context;
    const isStepped = step !== 0;

    return getOffset({
      value,
      sliderLength,
      clientXY: xyOffset,
      minValue,
      maxValue,
      dragState,
      orientation,
      volumeState,
      isStepped,
    });
  }, [context, volumeState]);
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
