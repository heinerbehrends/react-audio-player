import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useIsDisabled } from "../store/derived";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Seek({ children, amount, ...props }: SeekButtonComponentProps) {
  const seekAmount = useSeek(amount);
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      aria-label={`Seek ${amount > 0 ? "forward" : "backward"} by ${Math.abs(
        amount,
      )} seconds`}
      onKeyDown={handleMediaKeys}
      onClick={seekAmount}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

// `store.send` is a closure member with a permanent identity, so the
// `useCallback` this hook used to need is gone.
function useSeek(amount: number) {
  const { send } = usePlayerStore();
  return () => send({ type: "SET_TIME_FORWARD", value: amount });
}
