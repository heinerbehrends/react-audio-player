import { forwardRef } from "react";
import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { useMergedRef } from "../Shared/useMergedRef";
import { useSliderContext } from "./SliderContext";
import { progressStyles, containerStyles } from "./calculateStyle";

type SliderControlProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Parts to layer inside the track, such as `.Background` and `.Progress`. */
  children?: React.ReactNode;
};

/**
 * The slider itself. Renders a `<button role="slider">` with the `aria-value*`
 * attributes, the tab stop, the arrow keys and Home/End, and measures the
 * track. Required, exactly one per slider: without it the root renders and does
 * nothing, and logs an error in development. Do not nest `.Thumb` inside it.
 * `aria-label` and `aria-valuetext` can be overridden per instance, and your
 * `onPointerDown` and `onKeyDown` run alongside the library's. Carries
 * `data-part="control"`.
 */
export const SliderControl = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  SliderControlProps
>(function SliderControl({ children, ...props }, forwardedRef) {
  const { setSliderRef, aria, onTrackPointerDown, onKeyDown } =
    useSliderContext();
  const ref = useMergedRef(setSliderRef, forwardedRef);

  const style = {
    ...progressStyles,
    ...containerStyles,
    ...props.style,
  } satisfies React.CSSProperties;

  return (
    <button
      type="button"
      data-part="control"
      ref={ref}
      {...aria}
      {...props}
      // After the spread and composed rather than replaced: these carry the
      // operability `role` is locked for. `aria` stays *before* the spread, so a
      // consumer can still override `aria-label`.
      onPointerDown={composeEventHandlers(
        props.onPointerDown,
        onTrackPointerDown,
      )}
      onKeyDown={composeEventHandlers(props.onKeyDown, onKeyDown)}
      tabIndex={0}
      style={style}
      role="slider"
    >
      {children}
    </button>
  );
});
