import { useContext } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";
import { handleMediaKeys } from "../handleKeys";
import { areNumbersClose } from "../functionsLib";
type SetSpeedProps = {
  playbackRate: number;
  children: React.ReactNode;
  currentIndicator?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SetPlaybackRate({
  playbackRate,
  children,
  currentIndicator,
  ...props
}: SetSpeedProps) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { playbackRate: currentPlaybackRate, handlePlayerAction } =
    useContext(PlayerContext);
  function handleClick() {
    if (!audioElement) return;
    const limitedRate = Math.min(Math.max(playbackRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
  }
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
          console.log("onKeyDown", event);
          handleMediaKeys({
            event,
            handlePlayerAction,
            audioElement,
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
          audioElement,
        })
      }
      aria-label={`Set playback rate to ${playbackRate}x`}
      {...props}
    >
      {children}
    </button>
  );
}
