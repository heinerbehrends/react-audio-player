import { useContext, useRef, memo, useCallback } from "react";
import { PlayerContext, type PlayerProviderAction } from "./PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { useCueChange } from "./useCueChange";
import { areNumbersClose } from "../functionsLib";

const AudioElement = memo(function AudioElement() {
  const { handlePlayerAction, audioFiles, isMuted } = useContext(PlayerContext);
  const { audioElementRef, timelineCallbackRef, volumeCallbackRef } =
    useContext(AudioContext);
  const { src, captionSrc } = audioFiles?.[0] || {};

  const handleTimeUpdate = useCallback(() => {
    if (timelineCallbackRef?.current?.handleTimelineAction) {
      timelineCallbackRef.current.handleTimelineAction({
        type: "UPDATE_TIME",
        time: audioElementRef.current?.currentTime ?? 0,
      });
    }
  }, [timelineCallbackRef, audioElementRef]);

  const handleVolumeChange = useCallback(() => {
    if (isMuted) return;
    const volume = audioElementRef.current?.volume ?? 0;
    const volumeState = areNumbersClose(volume, 0)
      ? "muted"
      : volume < 0.5
      ? "low"
      : "high";
    handlePlayerAction({
      type: "SET_VOLUME_STATE",
      volumeState,
    });

    if (volumeCallbackRef?.current?.handleVolumeAction) {
      volumeCallbackRef.current.handleVolumeAction({
        type: "UPDATE_TIME",
        time: audioElementRef.current?.volume ?? 0,
      });
    }
  }, [volumeCallbackRef, audioElementRef, isMuted, handlePlayerAction]);

  const handleEnded = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
  }, [handlePlayerAction]);

  const handleError = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ERROR" });
  }, [handlePlayerAction]);

  const handleLoadedMetadata = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_LOADED" });
  }, [handlePlayerAction]);

  const hasTimelineCallback =
    !!timelineCallbackRef?.current?.handleTimelineAction;
  const hasVolumeCallback = !!volumeCallbackRef?.current?.handleVolumeAction;

  return (
    <audio
      aria-label="audio player"
      ref={audioElementRef}
      onSeeked={hasTimelineCallback ? handleTimeUpdate : undefined}
      onVolumeChange={hasVolumeCallback ? handleVolumeChange : undefined}
      onTimeUpdate={hasTimelineCallback ? handleTimeUpdate : undefined}
      onEnded={handleEnded}
      onError={handleError}
      onLoadedMetadata={handleLoadedMetadata}
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
