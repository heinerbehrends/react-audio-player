import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
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
 */
export function SeekButton({
  children,
  amount,
  ...props
}: SeekButtonComponentProps) {
  const seekAmount = useSeek(amount);
  const handleMediaKeys = useHandleMediaKeys();
  // `useSeek` sends `SET_TIME_FORWARD` whichever way `amount` points, and that
  // action reads `el.duration` — so a rewind needs one too.
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
