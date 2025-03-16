import { useContext, useRef, memo } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerProviderAction } from "./PlayerProvider";
import { useCueChange } from "./useCueChange";

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
        <Track src={captionSrc} handlePlayerAction={handlePlayerAction} />
      )}
    </audio>
  );
});

type TrackProps = {
  src: string;
  handlePlayerAction: (action: PlayerProviderAction) => void;
};

function Track({ src, handlePlayerAction }: TrackProps) {
  const trackRef = useRef<HTMLTrackElement | null>(null);
  useCueChange({ trackRef, handlePlayerAction });
  return <track ref={trackRef} kind="captions" src={src} default />;
}

export { AudioElement };
