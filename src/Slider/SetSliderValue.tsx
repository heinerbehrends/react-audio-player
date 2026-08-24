import { useMemo } from "react";
import { useSliderContext } from "./SliderContext";
import {
  progressStyles,
  containerStyles,
  buttonStyles,
} from "./calculateStyle";

type SetSliderValueProps = React.HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

/**
 * The element that carries the slider semantics: the role, every `aria-value*`,
 * the arrow keys and the tab stop. It is the one part of a slider that is always
 * present, which is why the semantics live here rather than on the thumb — a
 * consumer may render no thumb at all.
 *
 * It also measures the track, since it *is* the track.
 */
export function SetSliderValue({ children, ...props }: SetSliderValueProps) {
  const slider = useSliderContext();

  const style = useMemo(
    () => ({
      ...progressStyles,
      ...containerStyles,
      ...buttonStyles,
      ...props.style,
    }),
    [props.style],
  ) satisfies React.CSSProperties;

  return (
    <button
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
