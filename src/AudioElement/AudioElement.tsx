import { useContext, memo } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "./AudioContext";
import { Track } from "../Captions/Track";
import {
  useHandleTimeUpdate,
  useHandleVolumeChange,
  useHandlePlaybackRateChange,
  usePlayerCallbacks,
} from "./audioElementHooks";

export const AudioElement = memo(function AudioElement() {
  const { audioFiles } = useContext(PlayerContext);
  const {
    audioElementRef,
    timelineCallbackRef,
    volumeCallbackRef,
    playbackRateCallbackRef,
  } = useContext(AudioContext);
  const { src, captionSrc } = audioFiles?.[0] || {};
  const handleTimeUpdate = useHandleTimeUpdate();
  const handleVolumeChange = useHandleVolumeChange();
  const handlePlaybackRateChange = useHandlePlaybackRateChange();

  const {
    handleEnded,
    handleError,
    handleLoadedMetadata,
    handlePlayPause,
    handleDurationChange,
  } = usePlayerCallbacks();

  const hasTimelineCallback =
    !!timelineCallbackRef?.current?.handleTimelineAction;
  const hasVolumeCallback = !!volumeCallbackRef?.current?.handleVolumeAction;
  const hasPlaybackRateCallback =
    !!playbackRateCallbackRef?.current?.handlePlaybackRateAction;
  return (
    <audio
      aria-label="audio player"
      ref={audioElementRef}
      onSeeked={hasTimelineCallback ? handleTimeUpdate : undefined}
      onVolumeChange={hasVolumeCallback ? handleVolumeChange : undefined}
      onRateChange={
        hasPlaybackRateCallback ? handlePlaybackRateChange : undefined
      }
      onTimeUpdate={hasTimelineCallback ? handleTimeUpdate : undefined}
      onEnded={handleEnded}
      onError={handleError}
      onPause={handlePlayPause}
      onPlay={handlePlayPause}
      onLoadedMetadata={() => {
        handleLoadedMetadata(
          timelineCallbackRef?.current?.handleTimelineAction,
        );
      }}
      onDurationChange={() => {
        handleDurationChange(
          timelineCallbackRef?.current?.handleTimelineAction,
        );
      }}
      src={src}
    >
      {captionSrc && <Track src={captionSrc} />}
    </audio>
  );
});
