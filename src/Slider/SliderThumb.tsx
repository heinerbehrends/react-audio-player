import { composeEventHandlers } from "./composeEventHandlers";
import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type SliderThumbProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The draggable handle. Optional — `.Control` alone is a valid slider.
 *
 * Pointer-only: `aria-hidden` and `tabIndex={-1}` are locked, so exactly one
 * element per slider announces a value and takes the arrow keys. Grabbing it
 * off-centre does not jump the value.
 *
 * Position comes from an inline `transform`, which beats any stylesheet; size it
 * with a class and it self-centres. Render it as a sibling of `.Control`, never
 * inside it.
 */
export function SliderThumb(props: SliderThumbProps) {
  // Destructured like `SliderControl`: `react-hooks/refs` treats a context object
  // holding a ref callback as ref-like, and flags every member read off it.
  const { onThumbPointerDown, ...slider } = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      type="button"
      data-part="thumb"
      {...props}
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
}
