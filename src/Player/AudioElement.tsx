import { ComponentProps, useContext, useRef, isValidElement } from "react";
import { PlayerContext } from "./PlayerContext";

type TrackProps = ComponentProps<"track"> & {
  kind: "captions" | "chapters" | "descriptions" | "metadata" | "subtitles";
};

function Track(props: TrackProps) {
  return <track {...props} />;
}

type AudioElementProps = {
  children: React.ReactElement<TrackProps> & {
    type: typeof Track;
  };
};

export function AudioElement({ children }: AudioElementProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { dispatch, audioFiles, isMuted } = useContext(PlayerContext);
  if (!isValidElement(children) || children.type.name !== "Track") {
    throw new Error(
      "AudioElement only accepts an AudioElement.Track component as its child"
    );
  }

  return (
    <audio
      aria-label="loop player"
      ref={audioRef}
      onCanPlay={() => {
        dispatch({ type: "AUDIO_FILE_LOADED", element: audioRef.current });
      }}
      onEnded={() => {
        console.log("onEnded");
        dispatch({ type: "AUDIO_FILE_ENDED" });
      }}
      src={audioFiles[0]}
      muted={isMuted}
    >
      {children}
    </audio>
  );
}

AudioElement.Track = Track;
