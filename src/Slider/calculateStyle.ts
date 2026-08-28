import { getOffset, type Orientation } from "../Shared/sharedFunctions";

/**
 * Everything the styles need. Not the mode: how a slider fills depends on its
 * orientation, not on which slider it is.
 */
export type StyleContext = {
  value: number;
  minValue: number;
  maxValue: number;
  sliderLength: number;
  orientation: Orientation;
};

export function calculateDragStyle(context: StyleContext): React.CSSProperties {
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
  context: StyleContext,
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

/**
 * The fraction of the track that is filled. Direction is `transformOrigin`'s
 * job, so this cannot reuse `getOffset`, which counts vertical pixels from the
 * top and therefore runs opposite to the value.
 */
function getProgress({
  value,
  minValue,
  maxValue,
  sliderLength,
}: StyleContext): number {
  if (sliderLength === 0) {
    return 0;
  }
  const range = maxValue - minValue;
  if (range === 0) {
    return 0;
  }
  return (value - minValue) / range;
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
  height: "100%",
  position: "relative",
} as const;

export const buttonStyles = {
  border: "none",
  background: "none",
  padding: 0,
} satisfies React.CSSProperties;
