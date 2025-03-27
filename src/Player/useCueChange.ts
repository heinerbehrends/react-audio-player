import { useCallback, useEffect } from "react";
import { PlayerProviderAction } from "./PlayerContext";

type UseCueChangeArgs = {
  trackRef: React.RefObject<HTMLTrackElement | null>;
  handlePlayerAction: (action: PlayerProviderAction) => void;
};

export function useCueChange({
  trackRef,
  handlePlayerAction,
}: UseCueChangeArgs) {
  const handleCueChange = useCallback(
    (event: Event) => {
      const trackElement = event.currentTarget as HTMLTrackElement;
      if (!trackElement || !isTextTrack(trackElement.track)) {
        console.error("Current target is not a TextTrack or is null");
        return;
      }
      const track = trackElement.track;
      const cuesArray = Array.from(track.activeCues || []);
      handlePlayerAction({
        type: "CAPTION_CUE_CHANGE",
        cues: cuesArray as VTTCue[],
      });
    },
    [handlePlayerAction]
  );

  useEffect(() => {
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
