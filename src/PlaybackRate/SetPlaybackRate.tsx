import { useCallback, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { useHandleMediaKeys } from "../handleKeys";
import { areNumbersClose } from "../functionsLib";
import { useIsDisabled } from "../hooks";

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
  return (
    <button
      onClick={setPlaybackRate}
      onKeyDown={handleKeyDown}
      aria-label={`Set playback rate to ${rate}x`}
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
  const { playbackRate: currentPlaybackRate } = useContext(PlayerContext);
  const roundedRate = Math.round(currentPlaybackRate * 10) / 10;
  return (
    <span aria-label="Current playback rate" {...props}>
      {roundedRate}x
    </span>
  );
}

function useSetPlaybackRate(rate: number) {
  const { handlePlayerAction } = useContext(PlayerContext);
  const setPlaybackRate = useCallback(() => {
    handlePlayerAction({ type: "SET_PLAYBACK_RATE", playbackRate: rate });
  }, [handlePlayerAction, rate]);
  return setPlaybackRate;
}

function useIsCurrent(rate: number) {
  const { playbackRate: currentPlaybackRate } = useContext(PlayerContext);
  return areNumbersClose(rate, currentPlaybackRate);
}
