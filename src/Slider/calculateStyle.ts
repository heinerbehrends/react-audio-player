import { getOffset, type Orientation } from "./sliderMath";

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
    // A percentage inside `translate()` resolves against the element's own
    // border box, so the thumb self-centres at any size. The 20px this replaced
    // assumed the demo's 40px thumbs, and drew a 16px one 12px off.
    transform:
      orientation === "horizontal"
        ? `translate(calc(${offset}px - 50%), 0)`
        : `translate(0, calc(${offset}px - 50%))`,
    touchAction: "none",
    zIndex: 2,
  };
}

export function calculateProgressStyle(
  context: StyleContext,
): React.CSSProperties {
  const { orientation, sliderLength } = context;
  // Zero length means the track has not been measured yet (C10).
  const progress = sliderLength === 0 ? 0 : getProgress(context);
  return {
    transform:
      orientation === "vertical"
        ? `scaleY(${progress})`
        : `scaleX(${progress})`,
    transformOrigin: orientation === "vertical" ? "bottom" : "left",
    zIndex: 1,
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
}: Omit<StyleContext, "sliderLength" | "orientation">): number {
  const range = maxValue - minValue;
  if (range === 0) {
    return 0;
  }
  return (value - minValue) / range;
}

/**
 * One grid cell, spanned: the three layers stack by sharing it, and `scaleX()`
 * is relative to the size. Output rather than opinion, so it stays inline.
 */
export const progressStyles = {
  gridColumn: "1 / 1",
  gridRow: "1 / 1",
  width: "100%",
  height: "100%",
} satisfies React.CSSProperties;

/**
 * The layers stack in one order: background `0`, fill `1`, thumb `2`. Grid
 * items take a `z-index` without being positioned, so the order is stated here
 * rather than left to whichever layer makes a stacking context — the fill used
 * to win only because of its `transform` (S22).
 */
export const backgroundStyles = {
  ...progressStyles,
  zIndex: 0,
} satisfies React.CSSProperties;

/**
 * The slider root. `position: relative` is load-bearing: `Thumb` is
 * `position: absolute`, so without it the thumb's containing block is whichever
 * ancestor happens to be positioned. The volume and rate roots inlined a copy
 * of this without it, and their thumbs landed correctly only by luck.
 *
 * The root's `width` lives in `styles.css`: a layout opinion, and unreachable
 * by a consumer's class while it was inline.
 */
export const rootStyles = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "1fr",
  position: "relative",
} as const;

/** `rootStyles` plus the height, which the track needs to fill its root. */
export const containerStyles = {
  ...rootStyles,
  height: "100%",
} as const;
