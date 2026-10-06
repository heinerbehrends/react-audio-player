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

// React 19's resource props, which `@types/react` 18 does not declare. React
// 19 hoists the `<style>` into `<head>` once, keyed by `href`; React 18 renders
// it in place, once per fill, with the two props as inert attributes.
const hoisted = {
  href: "react-headless-audio-player-progress",
  precedence: "default",
} as React.StyleHTMLAttributes<HTMLStyleElement>;

/**
 * The filled part of the track. Renders a `<div data-part="progress">` scaled
 * by the root's `--progress`. Its size and transform come from a
 * zero-specificity rule the library renders itself, so any rule of yours on
 * `[data-part="progress"]` replaces them.
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
