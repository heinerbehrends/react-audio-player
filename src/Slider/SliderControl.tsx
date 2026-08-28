import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { useSliderContext } from "./SliderContext";
import { progressStyles, containerStyles } from "./calculateStyle";

type SliderControlProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

/**
 * The track, and the slider itself: this `<button>` carries `role="slider"`, the
 * `aria-value*` attributes, the tab stop, the arrow keys and `Home`/`End`.
 *
 * **Required.** Every slider needs exactly one, and it is what measures the
 * track — omit it and the geometry stays at zero, so there is no role, no aria,
 * no tab stop, and clicks do nothing. Do not nest `.Thumb` inside it: that
 * would put a `<button>` inside a `<button>`.
 *
 * One focusable, value-announcing element per slider is deliberate, and differs
 * from the APG/Radix arrangement where the thumb carries the role. The thumb
 * here is a pointer affordance only.
 *
 * `aria-label` is overridable — it is the only way to localise a slider — but
 * `role`, `tabIndex` and the pointer and key handlers are not: your
 * `onPointerDown` and `onKeyDown` run alongside the library's rather than
 * replacing them.
 */
export function SliderControl({ children, ...props }: SliderControlProps) {
  const slider = useSliderContext();

  const style = {
    ...progressStyles,
    ...containerStyles,
    ...props.style,
  } satisfies React.CSSProperties;

  return (
    <button
      type="button"
      data-part="control"
      ref={slider.setSliderRef}
      {...slider.aria}
      {...props}
      // After the spread, and composed rather than replaced: these carry the
      // operability that `role` is locked for — exactly one focusable,
      // arrow-driven element per slider. `slider.aria` stays *before* the
      // spread, so a consumer can still override `aria-label`.
      onPointerDown={composeEventHandlers(
        props.onPointerDown,
        slider.onTrackPointerDown,
      )}
      onKeyDown={composeEventHandlers(props.onKeyDown, slider.onKeyDown)}
      tabIndex={0}
      style={style}
      role="slider"
    >
      {children}
    </button>
  );
}
