import { useContext } from "react";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";
type SetSpeedProps = {
  playbackRate: number;
  children: React.ReactNode;
  currentIndicator: React.ReactNode;
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
  console.log("audioElement?.playbackRate", audioElement?.playbackRate);
  console.log("playbackRate", playbackRate);
  console.log("currentPlaybackRate", currentPlaybackRate);
  const isCurrent = playbackRate === currentPlaybackRate;
  return (
    <button onClick={handleClick} {...props}>
      {isCurrent ? currentIndicator : null}
      {children}
    </button>
  );
}
