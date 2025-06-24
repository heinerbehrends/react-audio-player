import { useAudioContext } from "./AudioContext";

type AudioElementState = {
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  muted: boolean;
  paused: boolean;
  ended: boolean;

  // The actual audio element for direct manipulation if needed
  audioElement: HTMLAudioElement | null;
};

export function useAudioElement(): AudioElementState {
  const { audioElementRef } = useAudioContext();
  const audioElement = audioElementRef.current;
  return {
    duration: audioElement?.duration ?? 0,
    currentTime: audioElement?.currentTime ?? 0,
    volume: audioElement?.volume ?? 0,
    playbackRate: audioElement?.playbackRate ?? 1,
    muted: audioElement?.muted ?? false,
    paused: audioElement?.paused ?? true,
    ended: audioElement?.ended ?? false,
    audioElement,
  };
}
