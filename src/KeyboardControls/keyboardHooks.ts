import { useContext, useCallback } from "react";
import { handleMediaKeys } from "./handleMediaKeys";
import { PlayerContext } from "../Player/PlayerContext";
import { handleTimelineKeys } from "./handleTimelineKeys";

export function useHandleMediaKeys() {
  const { handlePlayerAction, getPlayerState, playbackRate, volumeState } =
    useContext(PlayerContext);
  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleMediaKeys({
        event,
        handlePlayerAction,
        getPlayerState,
        playbackRate,
        volumeState,
      });
    },
    [handlePlayerAction, getPlayerState, playbackRate, volumeState]
  );
}

export function useHandleSliderKeys(type: "timeline" | "volume") {
  const { handlePlayerAction, getPlayerState, playbackRate, volumeState } =
    useContext(PlayerContext);
  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) =>
      handleTimelineKeys({
        event,
        handlePlayerAction,
        getPlayerState,
        type,
        playbackRate,
        volumeState,
      }),
    [handlePlayerAction, getPlayerState, playbackRate, volumeState, type]
  );
}
