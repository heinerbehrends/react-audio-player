import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { useSliderContext } from "./SliderContext";
import {
  progressStyles,
  containerStyles,
  buttonStyles,
} from "./calculateStyle";

type SetSliderValueProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

/**
 * The element that carries the slider semantics: the role, the `aria-value*`
 * attributes, the arrow keys and the tab stop. Always present — a consumer may
 * render no thumb at all — and it measures the track, since it is the track.
 */
export function SetSliderValue({ children, ...props }: SetSliderValueProps) {
  const slider = useSliderContext();

  const style = {
    ...progressStyles,
    ...containerStyles,
    ...buttonStyles,
    ...props.style,
  } satisfies React.CSSProperties;

  return (
    <button
      type="button"
      ref={slider.setSliderRef}
      {...slider.aria}
      {...props}
      // Composed, and placed after the spread, because these four are what make
      // the element operable: replacing `onKeyDown` alone would take out
      // arrow-key adjustment and every media shortcut. `role` was already
      // locked this way; the handlers and the tab stop encode the same
      // invariant — exactly one focusable, arrow-driven element per slider.
      //
      // `slider.aria` stays *before* the spread on purpose: overriding
      // `aria-label` is currently the only way to localise a slider.
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
