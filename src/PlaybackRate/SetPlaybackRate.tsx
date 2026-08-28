import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "../store/atom";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SetPlaybackRateProps = {
  /**
   * The rate to set — `1` is normal speed, `2` is double.
   *
   * **Not clamped to the slider's range.** This names an explicit rate, so
   * `rate={8}` sets 8 where `PlaybackRateSlider` would stop at 4. The write path
   * clamps to the element's own 0–16, so nothing throws.
   */
  rate: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Sets one specific rate — the "1x / 1.5x / 2x" row of buttons. Named "Set
 * playback rate to {rate}x".
 *
 * Carries `aria-current="true"` while the element is at its rate, within 0.001;
 * the attribute is absent otherwise rather than `"false"`.
 *
 * Live while loading; only an error disables it.
 */
export function SetPlaybackRate({
  rate,
  children,
  ...props
}: SetPlaybackRateProps) {
  const setPlaybackRate = useSetPlaybackRate(rate);
  const handleKeyDown = useHandleMediaKeys();
  const isCurrent = useIsCurrent(rate);
  const disabled = useDisabledButtonProps(setPlaybackRate, props.onClick);

  return (
    <button
      type="button"
      onKeyDown={handleKeyDown}
      aria-label={`Set playback rate to ${rate}x`}
      aria-current={isCurrent ? "true" : undefined}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
    >
      {children}
    </button>
  );
}

type CurrentIndicatorProps = {
  /** The rate to compare against, matched within 0.001. */
  rate: number;
  children: React.ReactNode;
};

/**
 * A marker for the rate in effect — a tick or dot beside a `.Set` button.
 *
 * Always renders `children`, hiding them with `visibility: hidden` when the rate
 * does not match, so the row does not reflow as the marker moves. The content is
 * therefore in the DOM either way: a presence check cannot tell the two states
 * apart, and nothing unreachable should go in it.
 */
export function CurrentIndicator({
  rate,
  children,
}: CurrentIndicatorProps): React.ReactElement | null {
  const isCurrent = useIsCurrent(rate);
  if (isCurrent) {
    return <>{children}</>;
  }
  return <span style={{ visibility: "hidden" }}>{children}</span>;
}

type RateDisplayProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * The current rate as text, rounded to two decimals and suffixed with `x` —
 * "1x", "1.76x". Named "Current playback rate" for assistive technology.
 */
export function RateDisplay({ ...props }: RateDisplayProps) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const roundedRate = Math.round(rate * 100) / 100;
  return (
    <span aria-label="Current playback rate" {...props}>
      {roundedRate}x
    </span>
  );
}

function useSetPlaybackRate(rate: number) {
  const { send } = usePlayerStore();
  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate });
}

function useIsCurrent(rate: number) {
  const store = usePlayerStore();
  const currentRate = useStore(store.rate);
  return areNumbersClose(rate, currentRate);
}
