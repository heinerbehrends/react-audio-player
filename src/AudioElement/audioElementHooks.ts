import { useContext, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "./AudioContext";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { SliderContextAction } from "../Slider/SliderContext";
import { TimelineContext } from "../Timeline/TimelineContext";

export function useHandleTimeUpdate() {
  const { audioElementRef, timelineCallbackRef } = useContext(AudioContext);
  const { dragState } = useContext(TimelineContext);

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
  const { handlePlayerAction } = useContext(PlayerContext);
  const { audioElementRef, volumeCallbackRef } = useContext(AudioContext);
  return useCallback(() => {
    const isMuted =
      audioElementRef.current?.muted ??
      areNumbersClose(audioElementRef.current?.volume ?? 0, 0);
    const volume = audioElementRef.current?.volume ?? 0;

    if (!volumeCallbackRef?.current?.handleVolumeAction) return;

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
      value: audioElementRef.current?.volume ?? 0,
      component: "volume",
    });
  }, [volumeCallbackRef, audioElementRef, handlePlayerAction]);
}

export function usePlayerCallbacks() {
  const { handlePlayerAction } = useContext(PlayerContext);
  const { audioElementRef } = useContext(AudioContext);
  const handleEnded = useCallback(() => {
    handlePlayerAction({ type: "AUDIO_FILE_ENDED" });
  }, [handlePlayerAction]);

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
    },
    [handlePlayerAction, audioElementRef],
  );

  const handlePause = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
  }, [handlePlayerAction]);

  const handlePlay = useCallback(() => {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
  }, [handlePlayerAction]);

  return {
    handleEnded,
    handleError,
    handleLoadedMetadata,
    handlePause,
    handlePlay,
  };
}

export function useHandlePlaybackRateChange() {
  const { audioElementRef, playbackRateCallbackRef } = useContext(AudioContext);
  return useCallback(() => {
    if (playbackRateCallbackRef?.current?.handlePlaybackRateAction) {
      playbackRateCallbackRef.current.handlePlaybackRateAction({
        type: "UPDATE_UI_VALUE",
        value: audioElementRef.current?.playbackRate ?? 1,
        component: "playbackRate",
      });
    }
  }, [playbackRateCallbackRef, audioElementRef]);
}
