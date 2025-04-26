import { useRef } from "react";
import {
  AudioContext,
  PlaybackRateProviderRef,
  VolumeProviderRef,
  type TimelineProviderRef,
} from "./AudioContext";
import { handleSideEffect } from "./handleSideEffect";

type TimelineProviderProps = {
  children: React.ReactNode;
};

export function AudioContextProvider({ children }: TimelineProviderProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const timelineCallbackRef = useRef<TimelineProviderRef>({
    handleSliderAction: null,
  });
  const volumeCallbackRef = useRef<VolumeProviderRef>({
    handleVolumeAction: null,
  });
  const playbackRateCallbackRef = useRef<PlaybackRateProviderRef>({
    handlePlaybackRateAction: null,
  });

  return (
    <AudioContext.Provider
      value={{
        audioElementRef,
        handleSideEffect,
        timelineCallbackRef,
        volumeCallbackRef,
        playbackRateCallbackRef,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
