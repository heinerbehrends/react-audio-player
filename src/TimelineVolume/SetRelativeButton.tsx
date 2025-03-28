import type { HTMLAttributes } from "react";
import type { TimelineContextAction } from "../Timeline/TimelineVolumeContext";
import { useContext, useRef, useCallback, useMemo } from "react";
import { TimelineContext } from "../Timeline/TimelineVolumeContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
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
  const { handleTimelineAction, sliderStart, sliderLength } = useContext(
    switchContext[type]
  );
  const { getPlayerState, handlePlayerAction } = useContext(PlayerContext);
  const { duration, currentTime, volume } = getPlayerState();
  const time = type === "timeline" ? currentTime : volume;
  const hasSetDimensions = useRef(false);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xOffset = event.clientX - sliderStart;
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset,
              sliderStart: 0,
              sliderLength,
              duration,
            })
          : calculateVolume({
              xOffset,
              sliderLength,
            });
      if (type === "volume") {
        handlePlayerAction({
          type: "UNMUTE",
        });
      }
      handleTimelineAction({
        type: "SEEK_TO_TIME",
        time,
        component: type,
      });
    },
    [
      type,
      sliderStart,
      sliderLength,
      handleTimelineAction,
      handlePlayerAction,
      duration,
    ]
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
      data-testid={type === "timeline" ? "timeline" : "volume"}
      onPointerDown={handlePointerDown}
      role="slider"
      tabIndex={-1}
      aria-label={type === "timeline" ? "Seek audio" : "Adjust volume"}
      aria-valuemin={0}
      aria-valuemax={type === "timeline" ? duration : 100}
      aria-valuenow={type === "timeline" ? time : time * 100}
      aria-valuetext={
        type === "timeline"
          ? `${Math.round(time)} seconds of ${Math.round(duration)} seconds`
          : `Volume ${Math.round(time * 100)}%`
      }
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
  if (!element || hasSentDimensions.current) {
    return;
  }
  const rect = element.getBoundingClientRect();
  handleTimelineAction({
    type: "TIMELINE_LOADED",
    component: type,
    sliderStart: rect.left,
    sliderLength: rect.width,
  });
  hasSentDimensions.current = true;
}

type SendTimelineLoadedProps = {
  element: HTMLButtonElement | null;
  handleTimelineAction: (action: TimelineContextAction) => void;
  hasSentDimensions: React.RefObject<boolean>;
  type: "timeline" | "volume";
};
