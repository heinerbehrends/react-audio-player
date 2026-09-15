/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { useStore } from "../store/atom";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type IncreaseDecreaseProps = {
  /** How much to add to the current rate. Negative slows down. */
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Steps the rate by a fixed amount, relative to whatever it is now. Named
 * "Increase playback rate by 0.25x" or "Decrease…", following the sign.
 *
 * Clamped to the library's 0.5–4 range, so holding it down stops at the ends.
 * Live while loading; only an error disables it.
 *
 * Carries `data-part="rate-change"`, and no `data-state`: a step has none.
 */
export function ChangePlaybackRate({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  return (
    <button {...usePlaybackRateChangeProps(amount, props)}>{children}</button>
  );
}

/**
 * `PlaybackRate.Change`'s props, for a `<button>` of your own: the
 * "Increase/Decrease playback rate by {n}x" name, the step, the error gate and
 * the media keys.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function usePlaybackRateChangeProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(amount: number, props?: P): ButtonPropsBag<P> {
  const handleChangePlaybackRate = useChangePlaybackRate(amount);
  const composed = useComposedButtonProps(
    handleChangePlaybackRate,
    props ?? {},
  );

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "rate-change",
    "aria-label":
      amount > 0
        ? `Increase playback rate by ${Math.abs(amount)}x`
        : `Decrease playback rate by ${Math.abs(amount)}x`,
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as ButtonPropsBag<P>;
}

// Subscribes to `rate` only to supply a value at click time, so every
// `ratechange` re-renders the button. `store.rate.get()` in the handler would do
// the same with no subscription (C8).
function useChangePlaybackRate(amount: number) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const { send } = store;

  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate + amount });
}
