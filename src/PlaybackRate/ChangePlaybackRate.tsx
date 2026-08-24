import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useStore } from "../store/atom";
import { useIsDisabled } from "../store/derived";
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
  const isDisabled = useIsDisabled();

  return (
    <button
      onClick={handleChangePlaybackRate}
      onKeyDown={handleMediaKeys}
      aria-label={
        amount > 0
          ? `Increase playback rate by ${Math.abs(amount)}x`
          : `Decrease playback rate by ${Math.abs(amount)}x`
      }
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

// The one live bug this phase fixes: `useAudioElement` read
// `audioElementRef.current.playbackRate` **during render**, correct today only
// because this component also subscribed to `PlayerContext`, which updated on
// the very event that changed the element. Subscribing to `rate` removes the
// tearing hazard rather than managing it.
function useChangePlaybackRate(amount: number) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const { send } = store;

  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate + amount });
}
