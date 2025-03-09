import type { HTMLAttributes } from "react";
import { TimelineContextAction } from "../Timeline/TimelineContext";
import { useContext, useRef, useCallback, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { handleTimelineKeys } from "./handleKeys";
import { PlayerContext } from "../Player/PlayerContext";

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
  const { dispatch, time } = useContext(switchContext[type]);
  const { element, dispatch: dispatchPlayer } = useContext(PlayerContext);
  const duration = element?.duration ?? 0;
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
      }),
    [time, duration, dispatch, dispatchPlayer, type]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) =>
      dispatch({
        type: "SEEK",
        clientX: event.clientX,
      }),
    [dispatch]
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
