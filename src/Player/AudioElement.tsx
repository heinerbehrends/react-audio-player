import { useContext, useRef, memo } from "react";
import { PlayerContext } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { PlayerProviderAction } from "./PlayerContext";
import { useCueChange } from "./useCueChange";

const AudioElement = memo(function AudioElement() {
  const { handlePlayerAction, audioFiles, isMuted } = useContext(PlayerContext);
  const { audioElementRef, timelineCallbackRef, volumeCallbackRef } =
    useContext(AudioContext);
  const { src, captionSrc } = audioFiles?.[0] || {};

  return (
    <audio
      aria-label="audio player"
      ref={audioElementRef}
      onSeeked={() => {
        if (!timelineCallbackRef?.current?.handleTimelineAction) {
          return;
        }
        timelineCallbackRef.current.handleTimelineAction({
          type: "UPDATE_TIME",
          time: audioElementRef.current?.currentTime || 0,
        });
      }}
      onVolumeChange={() => {
        if (!volumeCallbackRef?.current?.handleVolumeAction) {
          return;
        }
        volumeCallbackRef.current.handleVolumeAction({
          type: "UPDATE_TIME",
          time: audioElementRef.current?.volume || 0,
        });
      }}
      onEnded={() => {
        handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
      }}
      onError={() => {
        handlePlayerAction({
          type: "AUDIO_FILE_ERROR",
        });
      }}
      onLoadedMetadata={() => {
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
