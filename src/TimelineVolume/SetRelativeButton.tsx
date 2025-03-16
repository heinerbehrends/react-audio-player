import type { HTMLAttributes } from "react";
import { TimelineContextAction } from "../Timeline/TimelineVolumeContext";
import { useContext, useRef, useCallback, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
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
  const { handleTimelineAction, time, timelineLeft, timelineWidth } =
    useContext(switchContext[type]);
  const { handlePlayerAction } = useContext(PlayerContext);
  const { audioElement } = useContext(AudioContext);
  const duration = audioElement?.duration ?? 0;
  const hasSetDimensions = useRef(false);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleTimelineKeys({
        event,
        currentTime: time,
        duration,
        handleTimelineAction,
        handlePlayerAction,
        type,
      });
    },
    [time, duration, handleTimelineAction, handlePlayerAction, type]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xOffset = event.clientX - timelineLeft;
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset,
              timelineLeft: 0,
              timelineWidth,
              duration,
            })
          : calculateVolume({
              xOffset,
              timelineWidth,
            });
      handleTimelineAction({
        type: "SEEK_TO_TIME",
        time,
        component: type,
      });
    },
    [type, timelineLeft, timelineWidth, duration, handleTimelineAction]
  );

  const handleRef = useCallback(
    (element: HTMLButtonElement | null) =>
      sendTimelineLoaded({
        element,
        type,
        handleTimelineAction,
        hasSentDimensions: hasSetDimensions,
      }),
    [handleTimelineAction, type]
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
  type,
  handleTimelineAction,
  hasSentDimensions,
}: SendTimelineLoadedProps) {
  if (!element) {
    return;
  }
  if (hasSentDimensions.current) {
    return;
  }
  const rect = element.getBoundingClientRect();
  handleTimelineAction({
    type: "TIMELINE_LOADED",
    component: type,
    timelineLeft: rect.left,
    timelineWidth: rect.width,
  });
  hasSentDimensions.current = true;
}

type SendTimelineLoadedProps = {
  element: HTMLButtonElement | null;
  handleTimelineAction: (action: TimelineContextAction) => void;
  hasSentDimensions: React.RefObject<boolean>;
  type: "timeline" | "volume";
};
