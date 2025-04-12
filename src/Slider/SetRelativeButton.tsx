import type { HTMLAttributes } from "react";
import { useContext, useCallback, useMemo, useEffect, useRef } from "react";
import { TimelineContext } from "../Timeline/TimelineContext";
import { VolumeContext } from "../Volume/VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { calculateTime, calculateVolume } from "../Shared/sharedFunctions";

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
  const { handleTimelineAction, orientation } = useContext(switchContext[type]);
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
          component: type,
          sliderStart: orientation === "horizontal" ? rect.left : rect.top,
          sliderLength: orientation === "horizontal" ? rect.width : rect.height,
        });
      });

      const rect = element.getBoundingClientRect();
      handleTimelineAction({
        type: "SLIDER_LOADED",
        component: type,
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      });

      observerRef.current.observe(element);
    },
    [handleTimelineAction, type, orientation]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return handleRef;
}

function useHandlePointerDown(type: "timeline" | "volume") {
  const { getPlayerState, handlePlayerAction } = useContext(PlayerContext);
  const { duration } = getPlayerState();
  const { sliderStart, sliderLength, handleTimelineAction, orientation } =
    useContext(switchContext[type]);

  return useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xyOffset =
        orientation === "horizontal" ? event.clientX : event.clientY;
      const value =
        type === "timeline"
          ? calculateTime({
              xyOffset,
              sliderStart,
              sliderLength,
              duration,
            })
          : calculateVolume({
              xyOffset,
              sliderLength,
              sliderStart,
              orientation,
            });

      handleTimelineAction({
        type: "CHANGE_VALUE",
        value,
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
      orientation,
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
