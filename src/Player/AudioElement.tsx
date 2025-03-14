import { useContext, useRef, memo, useCallback } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";

function isTextTrack(target: EventTarget): target is TextTrack {
  return "activeCues" in target;
}

const AudioElement = memo(function AudioElement() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { dispatch, audioFiles, isMuted } = useContext(PlayerContext);
  const { setAudioElement, handleSideEffect } = useContext(AudioContext);

  const handleCueChange = useCallback(
    (event: Event) => {
      console.log("cuechange event", event.currentTarget);
      if (event.currentTarget && isTextTrack(event.currentTarget)) {
        const track = event.currentTarget;
        const cuesArray = Array.from(track.activeCues || []);
        dispatch({ type: "CAPTION_CUE_CHANGE", cues: cuesArray });
        console.log(track.activeCues);
      } else {
        console.error("Current target is not a TextTrack or is null");
      }
    },
    [dispatch]
  );

  return (
    <audio
      aria-label="loop player"
      ref={audioRef}
      onEnded={() => {
        handleSideEffect({ type: "AUDIO_FILE_ENDED" }, audioRef.current);
        dispatch({ type: "AUDIO_FILE_ENDED" });
      }}
      onError={(event) => {
        dispatch({
          type: "AUDIO_FILE_ERROR",
          error: new Error(event.toString()),
        });
      }}
      onLoadedMetadata={() => {
        setAudioElement(audioRef.current);
        dispatch({ type: "AUDIO_FILE_LOADED" });
      }}
      src={audioFiles?.[0]?.src}
      muted={isMuted}
    >
      {audioFiles?.[0]?.captionSrc ? (
        <track
          ref={(element) => {
            if (!element) {
              return;
            }

            element.track.mode = "showing";

            console.log("adding cuechange listener", element.track);
            element.track.addEventListener("cuechange", handleCueChange);

            return () => {
              element.track.removeEventListener("cuechange", handleCueChange);
            };
          }}
          kind="captions"
          src="captions.vtt"
          default
        />
      ) : null}
    </audio>
  );
});

export { AudioElement };
