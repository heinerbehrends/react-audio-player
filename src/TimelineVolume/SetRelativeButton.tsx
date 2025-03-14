import type { HTMLAttributes } from "react";
import { TimelineContextAction } from "../Timeline/TimelineContext";
import { useContext, useRef, useCallback, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { handleTimelineKeys } from "./handleKeys";
import { PlayerContext } from "../Player/PlayerContext";
import { AudioContext } from "../AudioElement/AudioContext";
import { calculateTime, calculateVolume } from "../functionsLib";

const switchContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

type SetRelativeButtonProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  type: "timeline" | "volume";
};

export function SetRelativeButton({
  children,
  type,
  ...props
}: SetRelativeButtonProps) {
  const { dispatch, time, timelineLeft, timelineWidth } = useContext(
    switchContext[type]
  );
  const { dispatch: dispatchPlayer } = useContext(PlayerContext);
  const { audioElement, handleSideEffect } = useContext(AudioContext);
  const duration = audioElement?.duration ?? 0;
  const hasSetDimensions = useRef(false);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        currentTime: time,
        duration,
        dispatch,
        dispatchPlayer,
        type,
        handleSideEffect,
        audioElement,
      }),
    [
      time,
      duration,
      dispatch,
      dispatchPlayer,
      type,
      handleSideEffect,
      audioElement,
    ]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xOffset = event.clientX - timelineLeft;
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset,
              timelineWidth,
              duration,
            })
          : calculateVolume({
              xOffset,
              timelineWidth,
            });
      handleSideEffect(
        {
          type: "SEEK_TO_TIME",
          time: time,
          component: type,
        },
        audioElement
      );
      dispatch({
        type: "SEEK_TO_TIME",
        time: time,
        component: type,
      });
    },
    [
      dispatch,
      type,
      timelineLeft,
      timelineWidth,
      duration,
      audioElement,
      handleSideEffect,
    ]
  );

  const handleRef = useCallback(
    (element: HTMLButtonElement | null) =>
      sendTimelineLoaded({
        element,
        dispatch,
        hasSentDimensions: hasSetDimensions,
      }),
    [dispatch]
  );

  const style = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      padding: 0,
      margin: 0,
      border: "none",
      background: "none",
      ...props.style,
    }),
    [props.style]
  );

  return (
    <button
      {...props}
      style={style}
      ref={handleRef}
      data-testid="timeline"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      {children}
    </button>
  );
}

function sendTimelineLoaded({
  element,
  dispatch,
  hasSentDimensions,
}: SendTimelineLoadedProps) {
  if (!element) {
    return;
  }
  if (hasSentDimensions.current) {
    return;
  }
  const rect = element.getBoundingClientRect();
  dispatch({
    type: "TIMELINE_LOADED",
    timelineLeft: rect.left,
    timelineWidth: rect.width,
  });
  hasSentDimensions.current = true;
}

type SendTimelineLoadedProps = {
  element: HTMLButtonElement | null;
  dispatch: (action: TimelineContextAction) => void;
  hasSentDimensions: React.RefObject<boolean>;
};
