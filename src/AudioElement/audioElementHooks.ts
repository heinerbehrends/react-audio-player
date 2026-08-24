import { useCallback } from "react";
import { useAudioContext } from "./AudioContext";
import { SliderContextAction } from "../Slider/SliderContext";
import { useTimelineContext } from "../Timeline/TimelineContext";

/**
 * What is left of the bus after the sync layer took over the player state: every
 * remaining push is a slider-reducer update, and those go in Phase 3. No handler
 * here dispatches to the retired player reducer any more — the event that used to be
 * mirrored into a reducer is the same event `syncFromElement` projects.
 */

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
  const { audioElementRef, volumeCallbackRef } = useAudioContext();

  return useCallback(() => {
    if (!volumeCallbackRef?.current?.handleVolumeAction) return;

    // The near-zero mute rule left with `SET_VOLUME_STATE`: it belongs to the
    // `useVolumeState` derivation, not to what the slider displays.
    volumeCallbackRef.current.handleVolumeAction({
      type: "UPDATE_UI_VALUE",
      value: audioElementRef.current?.volume ?? 0,
      component: "volume",
    });
  }, [volumeCallbackRef, audioElementRef]);
}

export function usePlayerCallbacks() {
  const { audioElementRef } = useAudioContext();

  const handleEnded = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "timeline",
      });
    },
    [],
  );

  const handleLoadedMetadata = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "SET_MAX_VALUE",
        maxValue: audioElementRef.current?.duration ?? 1,
      });
    },
    [audioElementRef],
  );

  const handleDurationChange = useCallback(
    (handleTimelineAction: ((action: SliderContextAction) => void) | null) => {
      if (!handleTimelineAction) return;
      handleTimelineAction({
        type: "SET_MAX_VALUE",
        maxValue: audioElementRef.current?.duration ?? 1,
      });
    },
    [audioElementRef],
  );

  return {
    handleEnded,
    handleLoadedMetadata,
    handleDurationChange,
  };
}

export function useHandlePlaybackRateChange() {
  const { audioElementRef, playbackRateCallbackRef } = useAudioContext();

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
