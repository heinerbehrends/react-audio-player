import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type SliderThumbProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The draggable handle. Optional — a slider works without one, and `.Control`
 * alone is a valid slider.
 *
 * Pointer-only, by design: `aria-hidden` and `tabIndex={-1}` are locked and
 * cannot be overridden, so that exactly one element per slider announces a value
 * and takes the arrow keys. Grabbing it off-centre does not jump the value.
 *
 * Position comes from an inline `transform`, which beats any stylesheet — size
 * it with a class and it self-centres at any size. Render it as a sibling of
 * `.Control`, never inside it.
 */
export function SliderThumb(props: SliderThumbProps) {
  const slider = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      type="button"
      data-part="thumb"
      {...props}
      // `tabIndex` and `aria-hidden` are locked as a pair: unhiding the thumb
      // would put a second value-announcing element in one slider.
      onPointerDown={composeEventHandlers(
        props.onPointerDown,
        slider.onThumbPointerDown,
      )}
      tabIndex={-1}
      aria-hidden="true"
      style={{ ...style, ...props.style }}
    />
  );
}
