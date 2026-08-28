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
  const disabled = useDisabledButtonProps(seekAmount, props.onClick);

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
