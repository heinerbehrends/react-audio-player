import { getOffset, type Orientation } from "../Shared/sharedFunctions";

/**
 * Everything the styles need, and nothing else. Note the absence of the mode:
 * how a slider fills is a question about its orientation, not about which
 * slider it is.
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
 * The fraction of the track that is filled — the value's position in its own
 * range, and nothing else. Direction is `transformOrigin`'s job, which is why
 * this must not derive from `getOffset`: that counts vertical pixels from the
 * top, so it runs opposite to the value.
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
