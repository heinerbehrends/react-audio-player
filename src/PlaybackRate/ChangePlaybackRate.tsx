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
 * `amount` is a leading argument rather than a key of `props` because a key
 * would flow into the bag, and React passes an unrecognised lowercase attribute
 * through to the DOM — `<button amount="0.25">` in the page source.
 *
 * Spread it last, onto a `<button>` or a component that renders one. Pass your
 * handlers in rather than adding them after the spread, where the library
 * cannot compose them.
 */
export function usePlaybackRateChangeProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(amount: number, props?: P): ButtonPropsBag<P> {
  const handleChangePlaybackRate = useChangePlaybackRate(amount);
  const composed = useComposedButtonProps(
    handleChangePlaybackRate,
    props ?? {},
  );

  // Asserted: TypeScript cannot prove a spread of a generic `P` is the bag.
  return {
    type: "button",
    "aria-label":
      amount > 0
        ? `Increase playback rate by ${Math.abs(amount)}x`
        : `Decrease playback rate by ${Math.abs(amount)}x`,
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as ButtonPropsBag<P>;
}

// Subscribes to `rate` rather than reading `el.playbackRate` during render,
// which would tear.
function useChangePlaybackRate(amount: number) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const { send } = store;

  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate + amount });
}
