import { useCallback, useEffect } from "react";
import { useAudioContext } from "../AudioElement/AudioContext";
import { useCaptionsContext } from "./CaptionsContext";

export function useToggleCaptions() {
  const { showCaptions, setShowCaptions } = useCaptionsContext();
  return useCallback(() => {
    setShowCaptions(!showCaptions);
  }, [showCaptions, setShowCaptions]);
}

type UseCueChangeArgs = {
  trackRef?: React.RefObject<HTMLTrackElement | null>;
};

export function useCueChange({ trackRef }: UseCueChangeArgs) {
  const { captionsCallbackRef } = useAudioContext();
  const handleCueChange = useCallback(
    function handleCueChange(event: Event) {
      const trackElement = event.currentTarget as HTMLTrackElement;
      if (!trackElement || !isTextTrack(trackElement.track)) {
        console.error("Current target is not a TextTrack or is null");
        return;
      }
      const track = trackElement.track;
      const cuesArray = Array.from(track.activeCues || []);
      captionsCallbackRef.current?.handleCueChange?.(cuesArray as VTTCue[]);
    },
    [captionsCallbackRef],
  );

  useEffect(() => {
    if (!trackRef) {
      return;
    }
    if (!trackRef.current) {
      return;
    }
    const trackElement = trackRef.current;
    if (isTextTrack(trackElement)) {
      trackElement.mode = "showing";
    }
    trackElement.addEventListener("cuechange", handleCueChange);
    return () => {
      trackElement.removeEventListener("cuechange", handleCueChange);
    };
  }, [handleCueChange, trackRef]);
}

function isTextTrack(target: EventTarget): target is TextTrack {
  return "activeCues" in target;
}
