import { forwardRef } from "react";
import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type SliderThumbProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The draggable handle. Optional: `.Control` alone is a working slider. Renders
 * a `<button data-part="thumb">` that is `aria-hidden` and out of the tab
 * order, positioned by an inline `transform`; size it with a class. Render it
 * as a sibling of `.Control`, not inside it.
 */
export const SliderThumb = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  SliderThumbProps
>(function SliderThumb(props, ref) {
  // Destructured like `SliderControl`: `react-hooks/refs` treats a context object
  // holding a ref callback as ref-like, and flags every member read off it.
  const { onThumbPointerDown, ...slider } = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      type="button"
      data-part="thumb"
      {...props}
      ref={ref}
      onPointerDown={composeEventHandlers(
        props.onPointerDown,
        onThumbPointerDown,
      )}
      // Locked as a pair, and after the spread so neither can be overridden:
      // unhiding the thumb would put a second value-announcing element in one
      // slider.
      tabIndex={-1}
      aria-hidden="true"
      style={{ ...style, ...props.style }}
    />
  );
});
