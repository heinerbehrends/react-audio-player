import { useContext, useCallback, useEffect } from "react";
import {
  SliderContextAction,
  SliderProviderAction,
  isSliderSideEffect,
  isSliderAction,
} from "./SliderContext";
import { SliderComponent } from "./SliderContext";
import { AudioContext } from "../AudioElement/AudioContext";

function useHandleSliderAction(dispatch: React.Dispatch<SliderContextAction>) {
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
  } = useContext(AudioContext);
  return useCallback(
    function handleSliderAction(action: SliderProviderAction) {
      if (isSliderSideEffect(action)) {
        handleSideEffect(action, audioElement);
      }
      if (isSliderAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect, dispatch]
  );
}

type UseAttachSliderCallbackArgs = {
  dispatch: React.Dispatch<SliderContextAction>;
  component: SliderComponent;
};

export function useAttachSliderCallback({
  dispatch,
  component,
}: UseAttachSliderCallbackArgs) {
  const { timelineCallbackRef, volumeCallbackRef, playbackRateCallbackRef } =
    useContext(AudioContext);
  const handleSliderAction = useHandleSliderAction(dispatch);
  useEffect(() => {
    if (component === "timeline") {
      if (!timelineCallbackRef?.current) {
        return;
      }
      timelineCallbackRef.current.handleTimelineAction = handleSliderAction;
    }
    if (component === "volume") {
      if (!volumeCallbackRef?.current) {
        return;
      }
      volumeCallbackRef.current.handleVolumeAction = handleSliderAction;
    }
    if (component === "playbackRate") {
      if (!playbackRateCallbackRef?.current) {
        return;
      }
      playbackRateCallbackRef.current.handlePlaybackRateAction =
        handleSliderAction;
    }
  }, [
    handleSliderAction,
    component,
    playbackRateCallbackRef,
    volumeCallbackRef,
    timelineCallbackRef,
  ]);
  return handleSliderAction;
}
