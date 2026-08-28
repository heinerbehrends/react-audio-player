import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { areNumbersClose } from "../Shared/areNumbersClose";
import { useStore } from "../store/atom";
import { useDisabledButtonProps } from "../Shared/useDisabledButtonProps";
import { usePlayerStore } from "../store/PlayerStoreContext";

type SetPlaybackRateProps = {
  rate: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SetPlaybackRate({
  rate,
  children,
  ...props
}: SetPlaybackRateProps) {
  const setPlaybackRate = useSetPlaybackRate(rate);
  const handleKeyDown = useHandleMediaKeys();
  const isCurrent = useIsCurrent(rate);
  const disabled = useDisabledButtonProps(setPlaybackRate, props.onClick);

  return (
    <button
      type="button"
      onKeyDown={handleKeyDown}
      aria-label={`Set playback rate to ${rate}x`}
      aria-current={isCurrent ? "true" : undefined}
      {...props}
      // Last, so the gate cannot be spread away.
      {...disabled}
    >
      {children}
    </button>
  );
}

type CurrentIndicatorProps = {
  rate: number;
  children: React.ReactNode;
};

export function CurrentIndicator({
  rate,
  children,
}: CurrentIndicatorProps): React.ReactElement | null {
  const isCurrent = useIsCurrent(rate);
  if (isCurrent) {
    return <>{children}</>;
  }
  return <span style={{ visibility: "hidden" }}>{children}</span>;
}

type RateDisplayProps = React.HTMLAttributes<HTMLSpanElement>;

export function RateDisplay({ ...props }: RateDisplayProps) {
  const store = usePlayerStore();
  const rate = useStore(store.rate);
  const roundedRate = Math.round(rate * 100) / 100;
  return (
    <span aria-label="Current playback rate" {...props}>
      {roundedRate}x
    </span>
  );
}

function useSetPlaybackRate(rate: number) {
  const { send } = usePlayerStore();
  return () => send({ type: "SET_PLAYBACK_RATE", playbackRate: rate });
}

function useIsCurrent(rate: number) {
  const store = usePlayerStore();
  const currentRate = useStore(store.rate);
  return areNumbersClose(rate, currentRate);
}
