/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import {
  useComposedButtonProps,
  type ButtonPropsBag,
} from "../Shared/useComposedButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels } from "./PlayerConfigContext";

type SeekButtonComponentProps = {
  /** The button's content. */
  children: React.ReactNode;
  /** How far to jump, in seconds. Negative rewinds. The browser clamps the result to the track. */
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Jumps by a fixed number of seconds. Renders a `<button>` named "Seek forward
 * by 10 seconds", following the sign of `amount`. Disabled with `aria-disabled`
 * until the duration is known and on a live stream, the same test as
 * `useIsSeekable()`. Carries `data-part="seek"`.
 */
export const SeekButton = /* @__PURE__ */ forwardRef<
  HTMLButtonElement,
  SeekButtonComponentProps
>(function SeekButton({ children, amount, ...props }, ref) {
  return (
    <button {...useSeekButtonProps(amount, props)} ref={ref}>
      {children}
    </button>
  );
});

/**
 * `SeekButton`'s props for a `<button>` of your own: the name, the jump, the
 * seekable gate and the keyboard shortcuts. Pass your props in the call and
 * spread the result last.
 */
export function useSeekButtonProps<
  P extends React.ButtonHTMLAttributes<HTMLButtonElement>,
>(amount: number, props?: P): ButtonPropsBag<P> {
  const seekAmount = useSeek(amount);
  const labels = useLabels();
  // `useSeek` sends `SET_TIME_FORWARD` whichever way `amount` points, and that
  // action reads `el.duration` — so a rewind needs one too.
  const composed = useComposedButtonProps(seekAmount, props ?? {}, {
    requiresSeekable: true,
  });

  // Cast: TypeScript cannot prove a spread of generic `P` is the bag.
  return {
    type: "button",
    "data-part": "seek",
    // The entry gets the signed `amount`, not "forward"/"backward": German puts
    // the verb last, which no slot in an English sentence can produce.
    "aria-label":
      labels?.seek?.({ amount }) ??
      `Seek ${amount > 0 ? "forward" : "backward"} by ${Math.abs(
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
