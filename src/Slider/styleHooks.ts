import { useMemo } from "react";
import { SliderContext } from "./SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function useOffset(context: SliderContext) {
  return useMemo(() => {
    return getOffset(context);
  }, [context]);
}

export function useDragStyle(context: SliderContext): React.CSSProperties {
  const { orientation } = context;
  const offset = useOffset(context);
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
    }),
    [offset, orientation]
  );
}

export function useIndicatorStyles(
  context: SliderContext
): React.CSSProperties {
  const progress = useProgress(context);
  return useMemo(
    () => ({
      transform: `scaleX(${progress})`,
      transformOrigin: "left",
    }),
    [progress]
  );
}

function useProgress(context: SliderContext): number {
  const { orientation } = context;
  const isVerticalVolume =
    context.component === "volume" && orientation === "vertical";
  const offset = useOffset(context);
  const progress = offset / context.sliderLength;
  return isVerticalVolume ? 1 - progress : progress;
}

export const progressStyles = {
  gridColumn: "1 / 1",
  gridRow: "1 / 1",
  width: "100%",
  height: "100%",
} satisfies React.CSSProperties;

export const containerStyles = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr",
  width: "100%",
  position: "relative",
} satisfies React.CSSProperties;

export const buttonStyles = {
  border: "none",
  background: "none",
  padding: 0,
} satisfies React.CSSProperties;
