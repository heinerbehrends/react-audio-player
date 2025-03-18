import { useRef } from "react";
import {
  AudioContext,
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
    handleTimelineAction: null,
  });
  const volumeCallbackRef = useRef<VolumeProviderRef>({
    handleVolumeAction: null,
  });

  return (
    <AudioContext.Provider
      value={{
        audioElementRef,
        handleSideEffect,
        timelineCallbackRef,
        volumeCallbackRef,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
