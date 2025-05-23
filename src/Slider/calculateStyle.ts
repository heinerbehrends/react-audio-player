import { SliderContext } from "./SliderContext";
import { getOffset } from "../Shared/sharedFunctions";

export function calculateDragStyle(
  context: SliderContext
): React.CSSProperties {
  const { orientation } = context;
  const offset = getOffset(context);
  return {
    position: "absolute",
    gridColumn: "1 / 1",
    gridRow: "1 / 1",
    cursor: "grab",
    transform:
      orientation === "horizontal"
        ? `translate(calc(${offset}px - 20px), 0)`
        : `translate(0, calc(${offset}px - 20px))`,
    touchAction: "none",
  };
}

export function calculateProgressStyle(
  context: SliderContext
): React.CSSProperties {
  const { orientation } = context;
  const progress = getProgress(context);
  return {
    transform:
      orientation === "vertical"
        ? `scaleY(${progress})`
        : `scaleX(${progress})`,
    transformOrigin: orientation === "vertical" ? "bottom" : "left",
  };
}

function getProgress(context: SliderContext): number {
  if (context.sliderLength === 0) {
    return 0;
  }
  const { orientation } = context;
  const isVerticalVolume =
    context.component === "volume" && orientation === "vertical";
  const offset = getOffset(context);
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
