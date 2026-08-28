import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useStore } from "../store/atom";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type IncreaseDecreaseProps = {
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ChangePlaybackRate({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  const handleChangePlaybackRate = useChangePlaybackRate(amount);
  const handleMediaKeys = useHandleMediaKeys();
  const disabled = useDisabledButtonProps(
    handleChangePlaybackRate,
    props.onClick,
  );

  return (
    <button
      type="button"
      onKeyDown={handleMediaKeys}
      aria-label={
        amount > 0
          ? `Increase playback rate by ${Math.abs(amount)}x`
          : `Decrease playback rate by ${Math.abs(amount)}x`
      }
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
    >
      {children}
    </button>
  );
}

// Subscribes to `rate` rather than reading `el.playbackRate` during render,
// which would tear.
function useChangePlaybackRate(amount: number) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const { send } = store;

  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate + amount });
}
