import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  /**
   * How far to jump, **in seconds**. Negative rewinds, and the accessible name
   * follows it: "Seek forward by 10 seconds" or "Seek backward by 10 seconds".
   * The browser clamps the result to the track.
   */
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A fixed-distance jump, forward or back. The one control that needs a duration:
 * it is marked `aria-disabled` until one is known, and on a live stream, where
 * there is no end to jump towards — in both directions, since a rewind is
 * computed against the duration too. `useIsSeekable()` is the same predicate.
 *
 * As with every control here the gate is `aria-disabled`, not native
 * `disabled`, so style it from `[aria-disabled="true"]`; while it is set,
 * activation does nothing, your own `onClick` included.
 */
export function SeekButton({
  children,
  amount,
  ...props
}: SeekButtonComponentProps) {
  const seekAmount = useSeek(amount);
  const handleMediaKeys = useHandleMediaKeys();
  // The one button that needs a duration: `useSeek` sends `SET_TIME_FORWARD`
  // whichever way `amount` points, and that action reads `el.duration`.
  const disabled = useDisabledButtonProps(seekAmount, props.onClick, {
    requiresSeekable: true,
  });

  return (
    <button
      type="button"
      aria-label={`Seek ${amount > 0 ? "forward" : "backward"} by ${Math.abs(
        amount,
      )} seconds`}
      onKeyDown={handleMediaKeys}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
    >
      {children}
    </button>
  );
}

// `store.send` has a permanent identity, so no `useCallback` is needed.
function useSeek(amount: number) {
  const { send } = usePlayerStore();
  return () => send({ type: "SET_TIME_FORWARD", value: amount });
}
