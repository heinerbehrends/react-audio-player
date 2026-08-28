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
      onPointerDown={slider.onTrackPointerDown}
      onKeyDown={slider.onKeyDown}
      tabIndex={0}
      {...slider.aria}
      {...props}
      style={style}
      role="slider"
    >
      {children}
    </button>
  );
}
