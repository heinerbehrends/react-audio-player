import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type SliderThumbProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A pointer-only thumb: hidden from assistive technology and out of the tab
 * order, so exactly one element per slider announces a value and takes arrow
 * keys. The drag belongs to `useSlider`; this only reports where it was grabbed.
 */
export function SliderThumb(props: SliderThumbProps) {
  const slider = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      type="button"
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
