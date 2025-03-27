import { useContext } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";

function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.05;
}

type SetSpeedProps = {
  playbackRate: number;
  children: React.ReactNode;
  currentIndicator?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SetSpeed({
  playbackRate,
  children,
  currentIndicator,
  ...props
}: SetSpeedProps) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const { playbackRate: currentPlaybackRate } = useContext(PlayerContext);
  function handleClick() {
    if (!audioElement) return;
    const limitedRate = Math.min(Math.max(playbackRate, 0.5), 4);
    audioElement.playbackRate = limitedRate;
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
      <button onClick={handleClick} {...props}>
        <span style={{ visibility: "hidden" }}>{currentIndicator}</span>
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      aria-label={`Set playback rate to ${playbackRate}x`}
      {...props}
    >
      {children}
    </button>
  );
}
