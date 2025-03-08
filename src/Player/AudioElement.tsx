import { useContext, useRef } from "react";
import { PlayerContext } from "./PlayerContext";

type AudioElementProps = {
  audioFile: string;
};

export function AudioElement({ audioFile }: AudioElementProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { dispatch } = useContext(PlayerContext);
  return (
    <audio
      aria-label="loop player"
      ref={audioRef}
      onCanPlay={() => {
        dispatch({ type: "AUDIO_FILE_LOADED", element: audioRef.current });
      }}
      src={audioFile}
    >
      <track kind="captions">
        {/* TODO: add captions with metadata from the audio file */}
      </track>
    </audio>
  );
}
