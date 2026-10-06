import { forwardRef, type HTMLAttributes } from "react";
import { fillStyles } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

/**
 * The fill's default size and transform, as a stylesheet rather than inline,
 * so a consumer's rule on `[data-part="progress"]` overrides them without
 * `!important` (S28). `:where()` has zero specificity, so any selector beats
 * it wherever it loads. Read from `--progress` on the root; `data-orientation`
 * is matched on the fill itself, since an ancestor's could belong to some other
 * component.
 *
 * No transition: the fill jumps to each `timeupdate` step and to a seek's
 * target alike, as the thumb does. A default glide also glided seeks, and only
 * a seek signal the store does not have could tell the two apart (S33).
 */
export const progressFillRules =
  ':where([data-part="progress"][data-orientation]){width:100%;height:100%;transform:scaleX(var(--progress,0));transform-origin:left}' +
  ':where([data-part="progress"][data-orientation="vertical"]){transform:scaleY(var(--progress,0));transform-origin:bottom}';

// React 19's resource props, which `@types/react` 18 does not declare.
const hoisted = {
  href: "react-headless-audio-player-progress",
  precedence: "default",
} as React.StyleHTMLAttributes<HTMLStyleElement>;

/**
 * The fill all three sliders share. Its size and transform come from
 * `progressFillRules` rather than inline, so a plain stylesheet rule can
 * replace them (S28).
 *
 * The rules ship in a `<style>` rendered beside the fill, so they need no
 * import and are in the server markup. React 19 hoists it into `<head>` once,
 * keyed by `href`; React 18 renders it in place, once per fill, and passes
 * `href` and `precedence` through as inert attributes.
 */
export const SliderProgress = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function SliderProgress(props, ref) {
  const { orientation } = useSliderContext();
  return (
    <>
      <style {...hoisted}>{progressFillRules}</style>
      <div
        data-part="progress"
        data-orientation={orientation}
        {...props}
        ref={ref}
        style={{ ...fillStyles, ...props.style }}
      />
    </>
  );
});
