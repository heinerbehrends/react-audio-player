/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  /**
   * How far to jump, **in seconds**. Negative rewinds, and the accessible name
   * follows the sign. The browser clamps the result to the track.
   */
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A fixed-distance jump, forward or back.
 *
 * The one button that needs a duration, in both directions — a rewind is
 * computed against the duration too. So it is `aria-disabled` before metadata
 * and on a live stream, where there is no end to jump towards.
 * `useIsSeekable()` is the same test.
 *
 * Carries `data-part="seek"`, and no `data-state`: a jump has none.
 */
export function SeekButton({
  children,
  amount,
  ...props
}: SeekButtonComponentProps) {
  return <button {...useSeekButtonProps(amount, props)}>{children}</button>;
}

/**
 * `SeekButton`'s props, for a `<button>` of your own: the name following the
 * sign of `amount`, the jump, the seekable gate and the media keys.
 *
 * Spread it last, onto a `<button>`, and pass your own handlers in the call —
 * after the spread they replace the library's rather than composing with it.
 */
export function useSeekButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(amount: number, props?: P): ButtonPropsBag<P> {
  const seekAmount = useSeek(amount);
  // `useSeek` sends `SET_TIME_FORWARD` whichever way `amount` points, and that
  // action reads `el.duration` — so a rewind needs one too.
  const composed = useComposedButtonProps(seekAmount, props ?? {}, {
    requiresSeekable: true,
  });

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "seek",
    "aria-label": `Seek ${amount > 0 ? "forward" : "backward"} by ${Math.abs(
      amount,
    )} seconds`,
    ...props,
    // Last, so the gate and the shortcuts cannot be spread away.
    ...composed,
  } as ButtonPropsBag<P>;
}

// `store.send` has a permanent identity, so no `useCallback` is needed.
function useSeek(amount: number) {
  const { send } = usePlayerStore();
  return () => send({ type: "SET_TIME_FORWARD", value: amount });
}
