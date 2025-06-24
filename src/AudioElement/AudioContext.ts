import { createContext, useContext } from "react";
import type { SliderContextAction } from "../Slider/SliderContext";

export type TimelineProviderRef = {
  handleTimelineAction: ((action: SliderContextAction) => void) | null;
};

export type VolumeProviderRef = {
  handleVolumeAction: ((action: SliderContextAction) => void) | null;
};

export type PlaybackRateProviderRef = {
  handlePlaybackRateAction: ((action: SliderContextAction) => void) | null;
};

export type SliderProviderRef = {
  handleSliderAction: ((action: SliderContextAction) => void) | null;
};

export type AudioContextType = {
  audioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  timelineCallbackRef: React.MutableRefObject<TimelineProviderRef>;
  volumeCallbackRef: React.MutableRefObject<VolumeProviderRef>;
  playbackRateCallbackRef: React.MutableRefObject<PlaybackRateProviderRef>;
};

export const AudioContext = createContext<AudioContextType>({
  audioElementRef: { current: null },
  timelineCallbackRef: { current: { handleTimelineAction: null } },
  volumeCallbackRef: { current: { handleVolumeAction: null } },
  playbackRateCallbackRef: { current: { handlePlaybackRateAction: null } },
});

AudioContext.displayName = "AudioContext";

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("AudioContext must be used within a AudioProvider");
  }
  return context;
}
