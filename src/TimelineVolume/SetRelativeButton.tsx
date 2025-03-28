import type { HTMLAttributes } from "react";
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
  const handlePointerDown = useHandlePointerDown(type);
  const handleRef = useHandleRef(type);

  const style = useMemo(
    () => ({
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      ...props.style,
      width: "100%",
      height: "100%",
    }),
    [props.style]
  );
  const { ariaLabel, ariaValueMin, ariaValueMax, ariaValueNow, ariaValueText } =
    useAriaAttributes(type);

  return (
    <button
      {...props}
      style={style}
      ref={handleRef}
      onPointerDown={handlePointerDown}
      role="slider"
      tabIndex={-1}
      aria-label={ariaLabel}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      aria-valuenow={ariaValueNow}
      aria-valuetext={ariaValueText}
    >
      {children}
    </button>
  );
}

function useHandleRef(type: "timeline" | "volume") {
  const { handleTimelineAction } = useContext(switchContext[type]);
  const hasSentDimensions = useRef(false);
  return useCallback(
    (element: HTMLButtonElement | null) => {
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
    },
    [handleTimelineAction, type]
  );
}

function useHandlePointerDown(type: "timeline" | "volume") {
  const { getPlayerState, handlePlayerAction } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const { sliderStart, sliderLength, handleTimelineAction } = useContext(
    switchContext[type]
  );
  return useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xOffset = event.clientX;
      const time =
        type === "timeline"
          ? calculateTime({
              xOffset,
              sliderStart,
              sliderLength,
              duration,
            })
          : calculateVolume({
              xOffset,
              sliderLength,
              sliderStart,
            });
      console.log(time);
      handleTimelineAction({
        type: "SEEK_TO_TIME",
        time,
        component: type,
      });
      if (type === "volume") {
        handlePlayerAction({
          type: "UNMUTE",
        });
      }
    },
    [
      handleTimelineAction,
      handlePlayerAction,
      duration,
      sliderStart,
      sliderLength,
      type,
    ]
  );
}

function useAriaAttributes(type: "timeline" | "volume") {
  const { getPlayerState } = useContext(PlayerContext);
  const { duration, currentTime } = getPlayerState();
  const time = type === "timeline" ? currentTime : currentTime * 100;
  return {
    ariaLabel: type === "timeline" ? "Seek audio" : "Adjust volume",
    ariaValueMin: 0,
    ariaValueMax: type === "timeline" ? duration : 100,
    ariaValueNow: type === "timeline" ? time : time,
    ariaValueText:
      type === "timeline"
        ? `${Math.round(time)} seconds of ${Math.round(duration)} seconds`
        : `Volume ${Math.round(time * 100)}%`,
  };
}
