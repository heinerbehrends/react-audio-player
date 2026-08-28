import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { useSliderContext } from "./SliderContext";
import {
  progressStyles,
  containerStyles,
  buttonStyles,
} from "./calculateStyle";

type SliderControlProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

/**
 * The element that carries the slider semantics: the role, the `aria-value*`
 * attributes, the arrow keys and the tab stop. Always present — a consumer may
 * render no thumb at all — and it measures the track, since it is the track.
 */
export function SliderControl({ children, ...props }: SliderControlProps) {
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
      data-part="control"
      ref={slider.setSliderRef}
      {...slider.aria}
      {...props}
      // After the spread, and composed: these carry the operability that
      // `role` is already locked for — exactly one focusable, arrow-driven
      // element per slider. `slider.aria` stays before it, since overriding
      // `aria-label` is the only way to localise a slider.
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
