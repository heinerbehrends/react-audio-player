import { useCallback, useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { handleMediaKeys } from "../handleKeys";
import { areNumbersClose } from "../functionsLib";

type SetPlaybackRateProps = {
  playbackRate: number;
  children: React.ReactNode;
  currentIndicator?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SetPlaybackRate({
  playbackRate,
  children,
  currentIndicator,
  ...props
}: SetPlaybackRateProps) {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  const { playbackRate: currentPlaybackRate } = getPlayerState();

  const handleClick = useCallback(() => {
    const limitedRate = Math.min(Math.max(playbackRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
  }, [handlePlayerAction, playbackRate]);

  const isCurrent = areNumbersClose(playbackRate, currentPlaybackRate);
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
      <button
        onClick={handleClick}
        {...props}
        onKeyDown={(event) => {
          handleMediaKeys({
            event,
            handlePlayerAction,
            getPlayerState,
          });
        }}
      >
        <span style={{ visibility: "hidden" }}>{currentIndicator}</span>
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      onKeyDown={(event) =>
        handleMediaKeys({
          event,
          handlePlayerAction,
          getPlayerState,
        })
      }
      aria-label={`Set playback rate to ${playbackRate}x`}
      {...props}
    >
      {children}
    </button>
  );
}
