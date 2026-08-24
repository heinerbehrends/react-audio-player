import { useCallback } from "react";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { useIsDisabled } from "../store/derived";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";
import { usePlayerContext } from "../Player/PlayerContext";

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
  const { playbackRate } = usePlayerContext();
  const roundedRate = Math.round(playbackRate * 100) / 100;
  return (
    <span aria-label="Current playback rate" {...props}>
      {roundedRate}x
    </span>
  );
}

function useSetPlaybackRate(rate: number) {
  const handleSideEffect = useHandleSideEffect();
  const setPlaybackRate = useCallback(() => {
    handleSideEffect({ type: "SET_PLAYBACK_RATE", playbackRate: rate });
  }, [handleSideEffect, rate]);
  return setPlaybackRate;
}

function useIsCurrent(rate: number) {
  const { playbackRate } = usePlayerContext();
  return areNumbersClose(rate, playbackRate);
}
