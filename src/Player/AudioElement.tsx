import { useContext, useRef, memo, useCallback, useEffect } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerProviderAction } from "./PlayerProvider";

function isTextTrack(target: EventTarget): target is TextTrack {
  return "activeCues" in target;
}

const AudioElement = memo(function AudioElement() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { handlePlayerAction, audioFiles, isMuted } = useContext(PlayerContext);
  const { setAudioElement } = useContext(AudioContext);
  const { src, captionSrc } = audioFiles?.[0] || {};

  return (
    <audio
      aria-label="loop player"
      ref={audioRef}
      onEnded={() => {
        handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
      }}
      onError={(event) => {
        handlePlayerAction({
          type: "AUDIO_FILE_ERROR",
          error: new Error(event.toString()),
        });
      }}
      onLoadedMetadata={() => {
        setAudioElement(audioRef.current);
        handlePlayerAction({ type: "AUDIO_FILE_LOADED" });
      }}
      src={src}
      muted={isMuted}
    >
      {captionSrc && (
        <Track
          src={captionSrc}
          audioRef={audioRef}
          handlePlayerAction={handlePlayerAction}
        />
      )}
    </audio>
  );
});

type TrackProps = {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  handlePlayerAction: (action: PlayerProviderAction) => void;
};

function Track({ src, audioRef, handlePlayerAction }: TrackProps) {
  const trackRef = useRef<HTMLTrackElement | null>(null);
  const handleCueChange = useCallback(
    (event: Event) => {
      const trackElement = event.currentTarget as HTMLTrackElement;
      if (trackElement && isTextTrack(trackElement.track)) {
        const track = trackElement.track;
        track.mode = "showing";
        const cuesArray = Array.from(track.activeCues || []);
        handlePlayerAction({
          type: "CAPTION_CUE_CHANGE",
          cues: cuesArray,
        });
      } else {
        console.error("Current target is not a TextTrack or is null");
      }
    },
    [handlePlayerAction]
  );

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }
    const trackElement = trackRef.current;
    console.log("audioElement", trackRef.current);
    if (isTextTrack(trackElement)) {
      trackElement.mode = "showing";
    }
    console.log("adding cuechange listener", trackElement, handleCueChange);
    trackElement.addEventListener("cuechange", handleCueChange);
    return () => {
      console.log("removing cuechange listener");
      trackElement.removeEventListener("cuechange", handleCueChange);
    };
  }, [handleCueChange, audioRef]);

  return <track ref={trackRef} kind="captions" src={src} default />;
}

export { AudioElement };
