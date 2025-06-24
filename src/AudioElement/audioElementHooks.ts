import { useCallback } from "react";
import { usePlayerContext } from "../Player/PlayerContext";
import { useAudioContext } from "./AudioContext";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { SliderContextAction } from "../Slider/SliderContext";
import { useTimelineContext } from "../Timeline/TimelineContext";

export function useHandleTimeUpdate() {
  const { audioElementRef, timelineCallbackRef } = useAudioContext();
  const { dragState } = useTimelineContext();

  return useCallback(() => {
    if (dragState === "dragging") return;
    if (timelineCallbackRef?.current?.handleTimelineAction) {
      timelineCallbackRef.current.handleTimelineAction({
        type: "UPDATE_UI_VALUE",
        value: audioElementRef.current?.currentTime ?? 0,
        component: "timeline",
      });
    }
  }, [timelineCallbackRef, audioElementRef, dragState]);
}

export function useHandleVolumeChange() {
  const { handlePlayerAction } = usePlayerContext();
  const { audioElementRef, volumeCallbackRef } = useAudioContext();

  return useCallback(() => {
    if (!volumeCallbackRef?.current?.handleVolumeAction) return;

    const volume = audioElementRef.current?.volume ?? 0;
    const isMuted =
      audioElementRef.current?.muted || areNumbersClose(volume, 0);

    if (isMuted) {
      volumeCallbackRef.current.handleVolumeAction({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "volume",
      });
      handlePlayerAction({
        type: "SET_VOLUME_STATE",
        volumeState: "muted",
      });
      return;
    }

    const volumeState = volume < 0.5 ? "low" : "high";
    handlePlayerAction({
      type: "SET_VOLUME_STATE",
      volumeState,
    });

    volumeCallbackRef.current.handleVolumeAction({
      type: "UPDATE_UI_VALUE",
      value: volume,
      component: "volume",
    });
  }, [volumeCallbackRef, audioElementRef, handlePlayerAction]);
}

export function usePlayerCallbacks() {
  const { handlePlayerAction } = usePlayerContext();
  const { audioElementRef } = useAudioContext();

  const handleEnded = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "timeline",
      });
    },
    [handlePlayerAction],
  );

  const handleError = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ERROR" });
  }, [handlePlayerAction]);

  const handleLoadedMetadata = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      handlePlayerAction({ type: "AUDIO_FILE_LOADED" });

      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "SET_MAX_VALUE",
        maxValue: audioElementRef.current?.duration ?? 1,
      });
      handlePlayerAction({
        type: "SET_DURATION",
        duration: audioElementRef.current?.duration ?? 1,
      });
    },
    [audioElementRef, handlePlayerAction],
  );

  const handleDurationChange = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      handlePlayerAction({
        type: "SET_DURATION",
        duration: audioElementRef.current?.duration ?? 1,
      });
      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "SET_MAX_VALUE",
        maxValue: audioElementRef.current?.duration ?? 1,
      });
    },
    [audioElementRef, handlePlayerAction],
  );

  const handlePlayPause = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
  }, [handlePlayerAction]);

  return {
    handleEnded,
    handleError,
    handleLoadedMetadata,
    handlePlayPause,
    handleDurationChange,
  };
}

export function useHandlePlaybackRateChange() {
  const { audioElementRef, playbackRateCallbackRef } = useAudioContext();
  const { handlePlayerAction } = usePlayerContext();

  return useCallback(() => {
    if (playbackRateCallbackRef?.current?.handlePlaybackRateAction) {
      playbackRateCallbackRef.current.handlePlaybackRateAction({
        type: "UPDATE_UI_VALUE",
        value: audioElementRef.current?.playbackRate ?? 1,
        component: "playbackRate",
      });
    }
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: audioElementRef.current?.playbackRate ?? 1,
    });
  }, [playbackRateCallbackRef, audioElementRef, handlePlayerAction]);
}
