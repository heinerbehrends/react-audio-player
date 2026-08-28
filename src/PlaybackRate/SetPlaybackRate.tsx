import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { useStore } from "../store/atom";
import { useIsDisabled } from "../store/derived";
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
  const isDisabled = useIsDisabled();
  const isCurrent = useIsCurrent(rate);

  return (
    <button
      type="button"
      onClick={setPlaybackRate}
      onKeyDown={handleKeyDown}
      aria-label={`Set playback rate to ${rate}x`}
      aria-current={isCurrent ? "true" : undefined}
      disabled={isDisabled}
      {...props}
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
