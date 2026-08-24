import { getOffset, type Orientation } from "../Shared/sharedFunctions";

/**
 * Everything the styles need, and nothing else — the whole slider context used
 * to be threaded through here. Note what is absent: the mode. How a slider fills
 * is a question about its orientation, not about which slider it is.
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
 * range, and nothing else.
 *
 * This used to derive from `getOffset`, which counts vertical pixels from the
 * top and therefore runs opposite to the value; vertical *volume* then flipped it
 * back, a double negative that happened to cancel. Keyed on
 * `component === "volume" && vertical`, so a vertical timeline rendered
 * backwards. The direction is `transformOrigin`'s job, and it always was.
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
