import { getFraction, getOffset, type Orientation } from "./sliderMath";

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

/**
 * The two numbers behind the fill and the thumb, as custom properties for the
 * slider root: `--progress`, the filled fraction as a unitless `0`–`1`, and
 * `--offset`, the thumb's position along the track in `px`, measured as the
 * thumb's own transform is — from the left, or from the top of a vertical
 * slider. Set on the root so they inherit to every part. Both are clamped to
 * the track (S29).
 *
 * `--progress` needs no measurement, so it is right from the first render;
 * `--offset` reads `0px` until the track is measured (C10).
 *
 * Strings, not numbers: React appends `px` to a bare number on a known
 * property and never on a custom one, so a string keeps both the same whatever
 * React decides. Cast because `React.CSSProperties` has no key for a custom
 * property.
 */
export function sliderCustomProperties(
  context: StyleContext,
): React.CSSProperties {
  return {
    "--progress": String(getFraction(context)),
    "--offset": `${getOffset(context)}px`,
  } as React.CSSProperties;
}

/**
 * What stays inline on the fill: its grid cell, and its place in the layer
 * stack.
 */
export const fillStyles = {
  gridColumn: "1 / 1",
  gridRow: "1 / 1",
  zIndex: 1,
} satisfies React.CSSProperties;

/**
 * One grid cell, spanned: the layers stack by sharing it. Output rather than
 * opinion, so it stays inline.
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
 *
 * `minmax(0, 1fr)`, not `1fr`: a bare `1fr` never shrinks below its content, so
 * an SVG or canvas drawn into `.Control` grew the slider past the height it was
 * given, to whatever its aspect ratio implied (S31). The cell still sizes to its
 * content where the root has no height.
 */
export const rootStyles = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gridTemplateRows: "minmax(0, 1fr)",
  position: "relative",
} as const;

/**
 * `rootStyles` for a root that may carry `hidden`. The inline `display: grid`
 * would otherwise outrank the attribute's `display: none`, and the slider would
 * stay on screen (S26).
 */
export function rootStylesFor(hidden: boolean | undefined) {
  return hidden ? { ...rootStyles, display: "none" } : rootStyles;
}

/** `rootStyles` plus the height, which the track needs to fill its root. */
export const containerStyles = {
  ...rootStyles,
  height: "100%",
} as const;
