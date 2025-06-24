import { useRef } from "react";
import {
  AudioContext,
  CaptionsProviderRef,
  PlaybackRateProviderRef,
  VolumeProviderRef,
  type TimelineProviderRef,
} from "./AudioContext";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export function AudioContextProvider({ children }: TimelineProviderProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const timelineCallbackRef = useRef<TimelineProviderRef>({
    handleTimelineAction: null,
  });
  const volumeCallbackRef = useRef<VolumeProviderRef>({
    handleVolumeAction: null,
  });
  const playbackRateCallbackRef = useRef<PlaybackRateProviderRef>({
    handlePlaybackRateAction: null,
  });
  const captionsCallbackRef = useRef<CaptionsProviderRef>({
    handleCueChange: null,
  });

  return (
    <AudioContext.Provider
      value={{
        audioElementRef,
        timelineCallbackRef,
        volumeCallbackRef,
        playbackRateCallbackRef,
        captionsCallbackRef,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
