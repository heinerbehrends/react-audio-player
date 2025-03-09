import { ComponentProps, useContext, useRef, memo } from "react";
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

type AudioElementComponent = React.FC<AudioElementProps> & {
  Track: typeof Track;
};

const AudioElementComponent = memo(function AudioElement({
  children,
}: AudioElementProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { dispatch, audioFiles, isMuted } = useContext(PlayerContext);
  if (children.type.name !== "Track") {
    console.error("AudioElement only accepts a track element as its child");
  }

  return (
    <audio
      aria-label="loop player"
      ref={audioRef}
      onCanPlay={() => {
        dispatch({ type: "AUDIO_FILE_LOADED", element: audioRef.current });
      }}
      onEnded={() => {
        dispatch({ type: "AUDIO_FILE_ENDED" });
      }}
      src={audioFiles[0]}
      muted={isMuted}
    >
      {children}
    </audio>
  );
}) as React.NamedExoticComponent<AudioElementProps>;

const AudioElement = Object.assign(AudioElementComponent, {
  Track,
}) as AudioElementComponent;

export { AudioElement };
