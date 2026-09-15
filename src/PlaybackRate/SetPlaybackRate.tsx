/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "../store/atom";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
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
 * A toggle button: `aria-pressed` is `"true"` on the rate in effect, within
 * 0.001, and `"false"` on the others, so the row announces as a set of choices.
 * The only button here with one — its name is fixed, so it has no other state
 * channel, while the rest carry theirs in a changing name (A4).
 *
 * Live while loading; only an error disables it.
 *
 * Carries `data-part="rate-set"`, and no `data-state`: style the current rate
 * from `[aria-pressed="true"]`, which already says it.
 */
export function SetPlaybackRate({
  rate,
  children,
  ...props
}: SetPlaybackRateProps) {
  return <button {...usePlaybackRateSetProps(rate, props)}>{children}</button>;
}

/** `aria-pressed` is always present too — the library's, or the consumer's. */
type SetPlaybackRateBag<P> = ButtonPropsBag<P> & {
  readonly "aria-pressed": React.AriaAttributes["aria-pressed"];
};

/**
 * `PlaybackRate.Set`'s props, for a `<button>` of your own: the "Set playback
 * rate to {rate}x" name, `aria-pressed`, the write, the error gate and the
 * media keys.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function usePlaybackRateSetProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(rate: number, props?: P): SetPlaybackRateBag<P> {
  const setPlaybackRate = useSetPlaybackRate(rate);
  const isCurrent = useIsCurrent(rate);
  const composed = useComposedButtonProps(setPlaybackRate, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "rate-set",
    "aria-label": `Set playback rate to ${rate}x`,
    // Written on every button, `false` included: omitting it leaves the inactive
    // rates announcing as plain buttons, so a listener cannot tell the row is a
    // set of choices or how many there are (A9).
    "aria-pressed": isCurrent,
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as SetPlaybackRateBag<P>;
}

type CurrentIndicatorProps = {
  /** The rate to compare against, matched within 0.001. */
  rate: number;
  children: React.ReactNode;
};

/**
 * A marker for the rate in effect — a tick or dot beside a `.Set` button.
 *
 * Always renders `children`, in a wrapper span that is `visibility: hidden` when
 * the rate does not match, so the marker keeps its box and the row does not
 * reflow as it moves. The wrapper is unconditional for that same reason (S17).
 *
 * The content is therefore in the DOM in both states: a presence check cannot
 * tell them apart, and nothing unreachable should go in it. `visibility: hidden`
 * keeps the hidden marker out of the accessibility tree, leaving `.Set`'s
 * `aria-pressed` as the announced signal.
 */
export function CurrentIndicator({
  rate,
  children,
}: CurrentIndicatorProps): React.ReactElement {
  const isCurrent = useIsCurrent(rate);
  return (
    <span style={isCurrent ? undefined : { visibility: "hidden" }}>
      {children}
    </span>
  );
}

type RateDisplayProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * The current rate as text, rounded to two decimals and suffixed with `x` —
 * "1x", "1.76x". Named "Current playback rate" for assistive technology, and
 * selectable as `[data-part="rate-display"]`.
 */
export function RateDisplay({ ...props }: RateDisplayProps) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const roundedRate = Math.round(rate * 100) / 100;
  return (
    <span
      data-part="rate-display"
      aria-label="Current playback rate"
      {...props}
    >
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
