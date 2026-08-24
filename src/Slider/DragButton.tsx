import { calculateDragStyle } from "./calculateStyle";
import { useSliderContext } from "./SliderContext";

type DragButtonProps = React.HTMLAttributes<HTMLButtonElement>;

/**
 * A pointer-only affordance: hidden from assistive technology and out of the tab
 * order, so there is exactly one element per slider that announces a value and
 * responds to arrow keys. The drag itself is `useSlider`'s — this only reports
 * where it was grabbed.
 */
export function DragButton(props: DragButtonProps) {
  const slider = useSliderContext();
  const style = calculateDragStyle(slider);

  return (
    <button
      onPointerDown={slider.onThumbPointerDown}
      tabIndex={-1}
      aria-hidden="true"
      {...props}
      style={{ ...style, ...props.style }}
    />
  );
}
