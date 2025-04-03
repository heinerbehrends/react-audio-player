import { useContext, memo, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "./AudioContext";
import { Track } from "../Captions/Track";
import { areNumbersClose } from "../functionsLib";

export const AudioElement = memo(function AudioElement() {
  const { handlePlayerAction, audioFiles, isMuted } = useContext(PlayerContext);
  const { audioElementRef, timelineCallbackRef, volumeCallbackRef } =
    useContext(AudioContext);
  const { src, captionSrc } = audioFiles?.[0] || {};
  const handleTimeUpdate = useHandleTimeUpdate();
  const handleVolumeChange = useHandleVolumeChange();
  const { handleEnded, handleError, handleLoadedMetadata, handlePause } =
    usePlayerCallbacks();

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
      onPause={handlePause}
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

function useHandleTimeUpdate() {
  const { audioElementRef, timelineCallbackRef } = useContext(AudioContext);
  return useCallback(() => {
    if (timelineCallbackRef?.current?.handleTimelineAction) {
      timelineCallbackRef.current.handleTimelineAction({
        type: "UPDATE_UI_VALUE",
        value: audioElementRef.current?.currentTime ?? 0,
      });
    }
  }, [timelineCallbackRef, audioElementRef]);
}

function useHandleVolumeChange() {
  const { handlePlayerAction, isMuted } = useContext(PlayerContext);
  const { audioElementRef, volumeCallbackRef } = useContext(AudioContext);
  return useCallback(() => {
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
        type: "UPDATE_UI_VALUE",
        value: audioElementRef.current?.volume ?? 0,
      });
    }
  }, [volumeCallbackRef, audioElementRef, isMuted, handlePlayerAction]);
}

function usePlayerCallbacks() {
  const { handlePlayerAction } = useContext(PlayerContext);
  const { audioElementRef } = useContext(AudioContext);
  const handleEnded = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
  }, [handlePlayerAction]);

  const handleError = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ERROR" });
  }, [handlePlayerAction]);

  const handleLoadedMetadata = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_LOADED" });
  }, [handlePlayerAction]);

  const handlePause = useCallback(() => {
    if (audioElementRef.current?.currentTime === 0) {
      handlePlayerAction({ type: "PAUSE" });
    }
  }, [handlePlayerAction, audioElementRef]);

  return {
    handleEnded,
    handleError,
    handleLoadedMetadata,
    handlePause,
  };
}
