import type { HTMLAttributes } from "react";
import { fillStyles, progressFillRules } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

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
export function SliderProgress(props: HTMLAttributes<HTMLDivElement>) {
  const { orientation } = useSliderContext();
  return (
    <>
      <style {...hoisted}>{progressFillRules}</style>
      <div
        data-part="progress"
        data-orientation={orientation}
        {...props}
        style={{ ...fillStyles, ...props.style }}
      />
    </>
  );
}
