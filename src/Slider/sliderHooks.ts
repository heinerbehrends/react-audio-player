import { useCallback, useRef, useEffect, useContext } from "react";
import { getClientXY } from "./useDrag";
import {
  isSliderAction,
  isSliderSideEffect,
  type SliderProviderAction,
  type SliderContext,
  type SliderContextAction,
} from "./SliderContext";
import { handleSideEffect } from "../AudioElement/handleSideEffect";
import { AudioContext } from "../AudioElement/AudioContext";

export function useOnPointerCancel(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction } = context;

  return useCallback(() => {
    handleTimelineAction({
      type: "CANCEL_DRAG",
    });
  }, [handleTimelineAction]);
}

export function useHandleRef(context: SliderContext) {
  const { handleSliderAction: handleTimelineAction, orientation } = context;
  const observerRef = useRef<ResizeObserver>();

  const handleRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }

      observerRef.current = new ResizeObserver(() => {
        const rect = element.getBoundingClientRect();
        handleTimelineAction({
          type: "SLIDER_LOADED",
          sliderStart: orientation === "horizontal" ? rect.left : rect.top,
          sliderLength: orientation === "horizontal" ? rect.width : rect.height,
        });
      });

      const rect = element.getBoundingClientRect();
      handleTimelineAction({
        type: "SLIDER_LOADED",
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      });

      observerRef.current.observe(element);
    },
    [handleTimelineAction, orientation]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return handleRef;
}

export type SliderComponent = "timeline" | "volume" | "playbackRate";
export type SliderEvent =
  | React.PointerEvent<HTMLButtonElement>
  | React.TouchEvent<HTMLButtonElement>;

type UseSetValueArgs = {
  context: SliderContext;
  component: SliderComponent;
  step?: number;
};

export function useSetValue({ context, component, step = 0 }: UseSetValueArgs) {
  const {
    sliderStart,
    sliderLength,
    handleSliderAction: handleTimelineAction,
    orientation,
    minValue,
    maxValue,
  } = context;
  return useCallback(
    (event: SliderEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "SET_SLIDER_VALUE",
        component,
        clientXY,
        sliderLength,
        sliderStart,
        orientation,
        minValue,
        maxValue,
        step,
      });
    },
    [
      handleTimelineAction,
      sliderStart,
      sliderLength,
      orientation,
      minValue,
      maxValue,
      component,
      step,
    ]
  );
}

type UseHandleActionArgs = {
  dispatch: React.Dispatch<SliderProviderAction>;
  action: SliderProviderAction;
};

export function useHandleAction({ dispatch, action }: UseHandleActionArgs) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  if (isSliderSideEffect(action)) {
    handleSideEffect(action, audioElement);
  }
  if (isSliderAction(action)) {
    dispatch(action);
  }
}

function useHandleSliderAction(dispatch: React.Dispatch<SliderContextAction>) {
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
  } = useContext(AudioContext);
  return useCallback(
    (action: SliderProviderAction) => {
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
