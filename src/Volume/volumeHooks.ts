import { useContext, useCallback } from "react";
import { VolumeContext, VolumeContextType } from "./VolumeContext";
import { PlayerContext } from "../Player/PlayerContext";
import { useOffset } from "../Slider/sliderHooks";
import { getClientXY } from "../Slider/useDrag";
import { calculateVolume } from "../Shared/sharedFunctions";

export function useHandleVolumeDragStart() {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  const context = useContext(VolumeContext);
  const { handleTimelineAction } = context;
  const offset = useOffset({ context, type: "volume" });
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
