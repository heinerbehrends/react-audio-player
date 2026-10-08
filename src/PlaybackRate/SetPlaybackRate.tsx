/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "../store/atom";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "../Player/PlayerConfigContext";

type SetPlaybackRateProps = {
  /** The rate to set; `1` is normal speed. Clamped to `AudioPlayer`'s `rateRange`. */
  rate: number;
  /** The button's content. */
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Sets one rate: a "1x / 1.5x / 2x" button. Renders a `<button>` named "Set
 * playback rate to 1.5x", with `aria-pressed="true"` on the rate in effect and
 * `"false"` on the others; style the current one from `[aria-pressed="true"]`.
 * Only an error disables it. Carries `data-part="rate-set"`.
 */
export const SetPlaybackRate = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  SetPlaybackRateProps
>(function SetPlaybackRate({ rate, children, ...props }, ref) {
  return (
    <button {...usePlaybackRateSetProps(rate, props)} ref={ref}>
      {children}
    </button>
  );
});

/** A `ButtonPropsBag` with `aria-pressed`. */
type SetPlaybackRateBag<P> = ButtonPropsBag<P> & {
  /** `true` on the rate in effect, `false` on the others. */
  readonly "aria-pressed": React.AriaAttributes["aria-pressed"];
};

/**
 * `PlaybackRate.Set`'s props for a `<button>` of your own: the name,
 * `aria-pressed`, the click, the error gate and the keyboard shortcuts. Pass
 * your props in the call and spread the result last.
 */
export function usePlaybackRateSetProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(rate: number, props?: P): SetPlaybackRateBag<P> {
  const setPlaybackRate = useSetPlaybackRate(rate);
  const isCurrent = useIsCurrent(rate);
  const labels = useLabels();
  const composed = useComposedButtonProps(setPlaybackRate, props ?? {});

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "rate-set",
    "aria-label":
      labels?.rateSet?.({ rate }) ?? `Set playback rate to ${rate}x`,
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
  /** The rate to mark, matched within 0.001. */
  rate: number;
  /** The marker. Always in the DOM, hidden while the rate is not current. */
  children: React.ReactNode;
};

/**
 * Marks the rate in effect: a tick or dot beside a `.Set` button. Renders a
 * `<span>` that is `visibility: hidden` while `rate` is not current, so the
 * marker keeps its space and the row does not reflow. The announced state is
 * `.Set`'s `aria-pressed`.
 */
export const CurrentIndicator = /* @__PURE__ */ forwardRef<
  HTMLSpanElement,
  CurrentIndicatorProps
>(function CurrentIndicator({ rate, children }, ref) {
  const isCurrent = useIsCurrent(rate);
  return (
    <span ref={ref} style={isCurrent ? undefined : { visibility: "hidden" }}>
      {children}
    </span>
  );
});

type RateDisplayProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * The current rate as text, to two decimals: "1x", "1.76x". Renders a
 * `<span data-part="rate-display">`. The text is its own accessible name.
 */
export const RateDisplay = /* @__PURE__ */ forwardRef<
  HTMLSpanElement,
  RateDisplayProps
>(function RateDisplay(props, ref) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const labels = useLabels();
  // Rounded before the entry sees it, so what is announced and what is shown
  // stay one number.
  const roundedRate = Math.round(rate * 100) / 100;
  return (
    <span data-part="rate-display" {...props} ref={ref}>
      {labels?.rateDisplay?.({ rate: roundedRate }) ?? `${roundedRate}x`}
    </span>
  );
});

function useSetPlaybackRate(rate: number) {
  const { setRate } = usePlayerStore().controls;
  return () => setRate(rate);
}

function useIsCurrent(rate: number) {
  const store = usePlayerStore();
  const currentRate = useStore(store.rate);
  return areNumbersClose(rate, currentRate);
}
