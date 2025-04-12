import { useContext, useCallback, useMemo } from "react";
import { VolumeContext, type VolumeContextType } from "./VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import {
  getOffset,
  useOffset,
  type GetOffsetArgs,
} from "../Slider/sliderHooks";
import { getClientXY } from "../Slider/useDrag";
import { calculateVolume } from "../Shared/sharedFunctions";

export function useHandleVolumeDragStart() {
  const { handlePlayerAction, getPlayerState, volumeState } =
    useContext(PlayerContext);
  const context = useContext(VolumeContext);
  const { handleTimelineAction } = context;
  const offset = useOffset({
    context,
    getOffset: getVolumeOffset(volumeState),
  });
  return useCallback(() => {
    handlePlayerAction({
      type: "UNMUTE",
    });
    handlePlayerAction({
      type: "SET_UNMUTE_VOLUME",
      unmuteVolume: getPlayerState().volume,
    });
    handleTimelineAction({
      type: "DRAG_START",
      clientXY: offset,
    });
  }, [handlePlayerAction, getPlayerState, handleTimelineAction, offset]);
}

export function useHandleDragEndVolume() {
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    useContext(VolumeContext);

  return useCallback(
    (event: PointerEvent | TouchEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "DRAG_END",
        component: "volume",
        clientXY,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [handleTimelineAction, orientation, sliderLength, sliderStart]
  );
}

export function useHandleDragVolume(context: VolumeContextType) {
  const { handleTimelineAction, orientation, sliderLength, sliderStart } =
    context;
  return useCallback(
    (event: PointerEvent | TouchEvent) => {
      const clientXY = getClientXY(event, orientation);
      handleTimelineAction({
        type: "DRAG",
        component: "volume",
        clientXY,
        sliderLength,
        sliderStart,
        orientation,
      });
    },
    [handleTimelineAction, orientation, sliderLength, sliderStart]
  );
}

export function useHandleSetVolume(context: VolumeContextType) {
  const { handlePlayerAction } = useContext(PlayerContext);
  const { sliderStart, sliderLength, handleTimelineAction, orientation } =
    context;

  return useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const xyOffset =
        orientation === "horizontal" ? event.clientX : event.clientY;
      const value = calculateVolume({
        xyOffset,
        sliderLength,
        sliderStart,
        orientation,
      });

      handleTimelineAction({
        type: "CHANGE_VALUE",
        value,
        component: "volume",
      });
      handlePlayerAction({
        type: "UNMUTE",
      });
    },
    [
      handleTimelineAction,
      handlePlayerAction,
      sliderStart,
      sliderLength,
      orientation,
    ]
  );
}

export function useVolumeAriaAttributes() {
  const { getPlayerState } = useContext(PlayerContext);
  const { volume } = getPlayerState();
  return {
    "aria-label": "Adjust volume",
    "aria-valuemin": 0,
    "aria-valuemax": 1,
    "aria-valuenow": volume,
    "aria-valuetext": `Volume ${Math.round(volume * 100)}%`,
  };
}

export type GetVolumeOffsetArgs = GetOffsetArgs & {
  volumeState: "muted" | "low" | "high";
};

export function getVolumeOffset(volumeState: "muted" | "low" | "high") {
  return (args: GetOffsetArgs): number => {
    const { orientation, sliderLength, xyOffset, value, dragState } = args;
    if (volumeState === "muted") {
      if (orientation === "horizontal") {
        return 0;
      }
      if (orientation === "vertical") {
        return sliderLength;
      }
    }
    return getOffset({
      value,
      sliderLength,
      xyOffset,
      dragState,
    });
  };
}

export function useDragStylesVolume(
  style: React.CSSProperties
): React.CSSProperties {
  const { volumeState } = useContext(PlayerContext);
  const context = useContext(VolumeContext);
  const { orientation } = context;
  const offset = useOffset({
    context,
    getOffset: getVolumeOffset(volumeState),
  });
  return useMemo(
    () => ({
      position: "absolute",
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      cursor: "grab",
      transform:
        orientation === "horizontal"
          ? `translate(calc(${offset}px - 20px), 0)`
          : `translate(0, calc(${offset}px - 20px))`,
      touchAction: "none",
      ...style,
    }),
    [offset, orientation, style]
  );
}

type UseVolumeIndicatorStylesArgs = {
  context: VolumeContextType;
  style: React.CSSProperties;
};

export function useVolumeIndicatorStyles({
  context,
  style,
}: UseVolumeIndicatorStylesArgs): React.CSSProperties {
  const { volumeState } = useContext(PlayerContext);
  const { sliderLength, orientation } = context;
  const offset = useOffset({
    context,
    getOffset: getVolumeOffset(volumeState),
  });
  const progress = offset / sliderLength;
  return useMemo(
    () => ({
      transform:
        orientation === "horizontal"
          ? `scaleX(${progress})`
          : `scaleY(${progress})`,
      width: "100%",
      height: "100%",
      transformOrigin: orientation === "horizontal" ? "left" : "bottom",
      ...style,
    }),
    [progress, orientation, style]
  );
}
