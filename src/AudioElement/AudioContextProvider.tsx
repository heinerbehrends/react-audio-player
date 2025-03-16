import { useState, useCallback } from "react";
import { AudioContext, TimelineProviderRef } from "./AudioContext";
import { handleSideEffect } from "./handleSideEffect";

export function AudioContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  // Store reference to timeline provider with proper typing
  const [timelineProviderRef, setTimelineProviderRef] =
    useState<React.RefObject<TimelineProviderRef> | null>(null);

  // Function to register timeline provider
  const registerTimelineProvider = useCallback(
    (timelineRef: React.RefObject<TimelineProviderRef>) => {
      console.log("TimelineProvider registered with AudioContextProvider");
      setTimelineProviderRef(timelineRef);

      // You can also trigger additional logic here when TimelineProvider registers
    },
    []
  );

  console.log(
    "AudioContext render, updateTime:",
    "timelineProviderRef:",
    timelineProviderRef
  );

  return (
    <AudioContext.Provider
      value={{
        audioElement,
        setAudioElement,
        handleSideEffect,
        setTimelineProviderRef: registerTimelineProvider,
        timelineProviderRef,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
