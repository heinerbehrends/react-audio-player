import { useContext, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import type { PlayerContextAction } from "../Player/PlayerContext";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";
import type { ToggleCaptionsAction } from "../Player/PlayerContext";

type ActionHandler<Action> = (action: Action) => void;

export type HandleMediaKeysArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handleSideEffect: ActionHandler<SideEffectAction>;
  handlePlayerAction: ActionHandler<PlayerContextAction>;
};

// Map of keyboard keys to their corresponding actions
const defaultKeyToActionMap: {
  [key: string]: SideEffectAction | ToggleCaptionsAction;
} = {
  p: { type: "TOGGLE_PLAY" },
  P: { type: "TOGGLE_PLAY" },
  k: { type: "TOGGLE_PLAY" },
  K: { type: "TOGGLE_PLAY" },
  MediaPlayPause: { type: "TOGGLE_PLAY" },
  " ": { type: "TOGGLE_PLAY" },
  s: { type: "STOP_AUDIO" },
  S: { type: "STOP_AUDIO" },
  MediaStop: { type: "STOP_AUDIO" },
  m: { type: "TOGGLE_MUTE" },
  M: { type: "TOGGLE_MUTE" },
  MediaMute: { type: "TOGGLE_MUTE" },
  l: { type: "SET_TIME_FORWARD", value: 10 },
  L: { type: "SET_TIME_FORWARD", value: 10 },
  ArrowRight: { type: "SET_TIME_FORWARD", value: 5 },
  ArrowLeft: { type: "SET_TIME_BACKWARD", value: 5 },
  MediaVolumeUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowDown: { type: "DECREASE_VOLUME", value: 0.025 },
  MediaVolumeDown: { type: "DECREASE_VOLUME", value: 0.025 },
  j: { type: "SET_TIME_BACKWARD", value: 10 },
  J: { type: "SET_TIME_BACKWARD", value: 10 },
  ">": { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
  "<": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  "]": { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
  "[": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  Backspace: { type: "RESET_PLAYBACK_RATE" },
  "0": { type: "SET_TIME_TO_START" },
  "1": { type: "SET_TIME_TO_PERCENT", percent: 0.1 },
  "2": { type: "SET_TIME_TO_PERCENT", percent: 0.2 },
  "3": { type: "SET_TIME_TO_PERCENT", percent: 0.3 },
  "4": { type: "SET_TIME_TO_PERCENT", percent: 0.4 },
  "5": { type: "SET_TIME_TO_PERCENT", percent: 0.5 },
  "6": { type: "SET_TIME_TO_PERCENT", percent: 0.6 },
  "7": { type: "SET_TIME_TO_PERCENT", percent: 0.7 },
  "8": { type: "SET_TIME_TO_PERCENT", percent: 0.8 },
  "9": { type: "SET_TIME_TO_PERCENT", percent: 0.9 },
  c: { type: "TOGGLE_CAPTIONS" },
  C: { type: "TOGGLE_CAPTIONS" },
};

export function handleMediaKeys(args: HandleMediaKeysArgs) {
  const { event, handleSideEffect, handlePlayerAction } = args;
  const action = defaultKeyToActionMap[event.key];

  if (!action) return false;

  if (action.type === "TOGGLE_CAPTIONS") {
    handlePlayerAction(action);
    event.preventDefault();
    return true;
  }
  handleSideEffect(action);
  event.preventDefault();
  return true;
}

export function useHandleMediaKeys() {
  const { handlePlayerAction } = useContext(PlayerContext);
  const handleSideEffect = useHandleSideEffect();
  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const result = handleMediaKeys({
        event,
        handleSideEffect,
        handlePlayerAction,
      });

      if (result) {
        event.stopPropagation();
      }

      return result;
    },
    [handleSideEffect, handlePlayerAction],
  );
}
