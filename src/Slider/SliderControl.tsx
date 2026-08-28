import { composeEventHandlers } from "./composeEventHandlers";
import { useSliderContext } from "./SliderContext";
import { progressStyles, containerStyles } from "./calculateStyle";

type SliderControlProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

/**
 * The track, and the slider itself: this `<button>` carries `role="slider"`, the
 * `aria-value*` attributes, the tab stop, the arrow keys and `Home`/`End`.
 *
 * **Required**, exactly one per slider, and it is what measures the track. Omit
 * it and the geometry stays at zero: no role, no aria, no tab stop, and clicks
 * do nothing. Do not nest `.Thumb` inside it — that would put a `<button>` in a
 * `<button>`.
 *
 * One focusable, value-announcing element per slider is deliberate, and differs
 * from the APG/Radix arrangement where the thumb carries the role.
 *
 * `aria-label` is overridable, and the only way to localise a slider. `role`,
 * `tabIndex` and the handlers are not: your `onPointerDown` and `onKeyDown` run
 * alongside the library's rather than replacing them.
 */
export function SliderControl({ children, ...props }: SliderControlProps) {
  const { setSliderRef, aria, onTrackPointerDown, onKeyDown } =
    useSliderContext();

  const style = {
    ...progressStyles,
    ...containerStyles,
    ...props.style,
  } satisfies React.CSSProperties;

  return (
    <button
      type="button"
      data-part="control"
      ref={setSliderRef}
      {...aria}
      {...props}
      // After the spread, and composed rather than replaced: these carry the
      // operability that `role` is locked for — exactly one focusable,
      // arrow-driven element per slider. `aria` stays *before* the
      // spread, so a consumer can still override `aria-label`.
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
}
