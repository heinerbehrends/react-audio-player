import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

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
