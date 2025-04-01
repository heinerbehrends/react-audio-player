import { useCallback, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { useHandleMediaKeys } from "../handleKeys";
import { areNumbersClose } from "../functionsLib";

type SetPlaybackRateProps = {
  rate: number;
  children: React.ReactNode;
  currentIndicator?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SetPlaybackRate({
  rate,
  children,
  currentIndicator,
  ...props
}: SetPlaybackRateProps) {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  const { playbackRate: currentPlaybackRate } = getPlayerState();

  const handleClick = useCallback(() => {
    const limitedRate = Math.min(Math.max(rate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
  }, [handlePlayerAction, rate]);

  const handleKeyDown = useHandleMediaKeys();

  const isCurrent = areNumbersClose(rate, currentPlaybackRate);
  if (currentIndicator) {
    if (isCurrent) {
      return (
        <button onClick={handleClick} {...props}>
          {currentIndicator}
          {children}
        </button>
      );
    }
    return (
      <button onClick={handleClick} onKeyDown={handleKeyDown} {...props}>
        <span style={{ visibility: "hidden" }}>{currentIndicator}</span>
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Set playback rate to ${rate}x`}
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

export function CurrentIndicator({ rate, children }: CurrentIndicatorProps) {
  const { playbackRate: currentPlaybackRate } = useContext(PlayerContext);
  const isCurrent = areNumbersClose(rate, currentPlaybackRate);
  if (isCurrent) {
    return children;
  }
  return null;
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
