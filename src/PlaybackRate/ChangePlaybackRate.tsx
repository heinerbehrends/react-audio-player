/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "../Player/PlayerConfigContext";

type IncreaseDecreaseProps = {
  /** How much to add to the rate. Negative slows down. */
  amount: number;
  /** The button's content. */
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Steps the rate by a fixed amount. Renders a `<button>` named "Increase
 * playback rate by 0.25x" or "Decrease playback rate by 0.25x", following the
 * sign. Stops at `0.125` and `8`, and never moves the rate against its own
 * direction. Only an error disables it. Carries `data-part="rate-change"`.
 */
export const ChangePlaybackRate = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  IncreaseDecreaseProps
>(function ChangePlaybackRate({ amount, children, ...props }, ref) {
  return (
    <button {...usePlaybackRateChangeProps(amount, props)} ref={ref}>
      {children}
    </button>
  );
});

/**
 * `PlaybackRate.Change`'s props for a `<button>` of your own: the name, the
 * step, the error gate and the keyboard shortcuts. Pass your props in the call
 * and spread the result last.
 */
export function usePlaybackRateChangeProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(amount: number, props?: P): ButtonPropsBag<P> {
  const handleChangePlaybackRate = useChangePlaybackRate(amount);
  const labels = useLabels();
  const composed = useComposedButtonProps(
    handleChangePlaybackRate,
    props ?? {},
  );

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "rate-change",
    // The entry gets the signed `amount`, and decides the direction wording.
    "aria-label":
      labels?.rateChange?.({ amount }) ??
      (amount > 0
        ? `Increase playback rate by ${Math.abs(amount)}x`
        : `Decrease playback rate by ${Math.abs(amount)}x`),
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as ButtonPropsBag<P>;
}

// The same two actions the `<` and `>` keys send. They read the rate off the
// element when the click lands, so there is nothing to subscribe to — a
// subscription to `rate` re-rendered the button on every `ratechange` — and
// they stop at `RATE_LIMITS`, so the button and the keys share the same two
// ends (C8, C14).
function useChangePlaybackRate(amount: number) {
  const { send } = usePlayerStore();
  const value = Math.abs(amount);

  return () =>
    send(
      amount >= 0
        ? { type: "INCREASE_PLAYBACK_RATE", value }
        : { type: "DECREASE_PLAYBACK_RATE", value },
    );
}
