import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type DragButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A pointer-only affordance: hidden from assistive technology and out of the tab
 * order, so exactly one element per slider announces a value and takes arrow
 * keys. The drag is `useSlider`'s; this only reports where it was grabbed.
 */
export function DragButton(props: DragButtonProps) {
  const slider = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      type="button"
      onPointerDown={slider.onThumbPointerDown}
      tabIndex={-1}
      aria-hidden="true"
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
