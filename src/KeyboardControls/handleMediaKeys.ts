import { useContext, useCallback, type MutableRefObject } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import type { PlayerContextAction, VolumeState } from "../Player/PlayerContext";
import { areNumbersClose } from "../Shared/sharedFunctions";
import type { SliderComponent } from "../Slider/SliderContext";
import {
  AudioContext,
  type VolumeProviderRef,
} from "../AudioElement/AudioContext";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";

type ActionHandler<Action> = (action: Action) => void;

export type HandleMediaKeysArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handleSideEffect: ActionHandler<SideEffectAction>;
  handlePlayerAction: ActionHandler<PlayerContextAction>;
  duration: number;
  currentTime: number;
  volume: number;
  unmuteVolume: number;
  playbackRate: number;
  volumeState: VolumeState;
  component?: SliderComponent | undefined;
  volumeCallbackRef?: MutableRefObject<VolumeProviderRef>;
  unmuteVolumeRef: { current: number };
  isMuted: boolean;
};

// First define the action types
type KeyAction =
  | { type: "TOGGLE_PLAY" }
  | { type: "STOP" }
  | { type: "TOGGLE_MUTE" }
  | { type: "INCREASE_VOLUME"; value: number }
  | { type: "DECREASE_VOLUME"; value: number }
  | { type: "INCREASE_PLAYBACK_RATE"; value: number }
  | { type: "DECREASE_PLAYBACK_RATE"; value: number }
  | { type: "RESET_PLAYBACK_RATE" }
  | { type: "SET_TIME_FORWARD"; value: number }
  | { type: "SET_TIME_FORWARD_FAST"; value: number }
  | { type: "SET_TIME_BACKWARD"; value: number }
  | { type: "SET_TIME_BACKWARD_FAST"; value: number }
  | { type: "SET_TIME_TO_START" }
  | { type: "SET_TIME_TO_10_PERCENT" }
  | { type: "SET_TIME_TO_20_PERCENT" }
  | { type: "SET_TIME_TO_30_PERCENT" }
  | { type: "SET_TIME_TO_40_PERCENT" }
  | { type: "SET_TIME_TO_50_PERCENT" }
  | { type: "SET_TIME_TO_60_PERCENT" }
  | { type: "SET_TIME_TO_70_PERCENT" }
  | { type: "SET_TIME_TO_80_PERCENT" }
  | { type: "SET_TIME_TO_90_PERCENT" }
  | { type: "TOGGLE_CAPTIONS" };

// Then use it in the map type
type KeyToActionMap = {
  [key: string]: KeyAction;
};

const defaultKeyToActionMap: KeyToActionMap = {
  p: { type: "TOGGLE_PLAY" },
  P: { type: "TOGGLE_PLAY" },
  k: { type: "TOGGLE_PLAY" },
  K: { type: "TOGGLE_PLAY" },
  MediaPlayPause: { type: "TOGGLE_PLAY" },
  " ": { type: "TOGGLE_PLAY" },
  s: { type: "STOP" },
  S: { type: "STOP" },
  MediaStop: { type: "STOP" },
  m: { type: "TOGGLE_MUTE" },
  M: { type: "TOGGLE_MUTE" },
  MediaMute: { type: "TOGGLE_MUTE" },
  l: { type: "SET_TIME_FORWARD", value: 30 },
  L: { type: "SET_TIME_FORWARD", value: 30 },
  ArrowRight: { type: "SET_TIME_FORWARD", value: 5 },
  ArrowLeft: { type: "SET_TIME_BACKWARD", value: 5 },
  MediaVolumeUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowDown: { type: "DECREASE_VOLUME", value: 0.025 },
  MediaVolumeDown: { type: "DECREASE_VOLUME", value: 0.025 },
  j: { type: "SET_TIME_BACKWARD", value: 10 },
  J: { type: "SET_TIME_BACKWARD", value: 10 },
  ">": { type: "INCREASE_PLAYBACK_RATE", value: 0.25 },
  "<": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  "]": { type: "INCREASE_PLAYBACK_RATE", value: 0.25 },
  "[": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  Backspace: { type: "RESET_PLAYBACK_RATE" },
  "0": { type: "SET_TIME_TO_START" },
  "1": { type: "SET_TIME_TO_10_PERCENT" },
  "2": { type: "SET_TIME_TO_20_PERCENT" },
  "3": { type: "SET_TIME_TO_30_PERCENT" },
  "4": { type: "SET_TIME_TO_40_PERCENT" },
  "5": { type: "SET_TIME_TO_50_PERCENT" },
  "6": { type: "SET_TIME_TO_60_PERCENT" },
  "7": { type: "SET_TIME_TO_70_PERCENT" },
  "8": { type: "SET_TIME_TO_80_PERCENT" },
  "9": { type: "SET_TIME_TO_90_PERCENT" },
};

type ActionToFunctionMap = {
  [key in KeyAction["type"]]: (args: HandleMediaKeysArgs) => boolean;
};

function createActionToFunctionMap(
  args: HandleMediaKeysArgs,
): ActionToFunctionMap {
  return {
    TOGGLE_PLAY: handleTogglePlay,
    STOP: handleStopAudio,
    TOGGLE_MUTE: handleToggleMute,
    INCREASE_VOLUME: handleVolumeUp,
    DECREASE_VOLUME: handleVolumeDown,
    TOGGLE_CAPTIONS: handleToggleCaptions,
    RESET_PLAYBACK_RATE: handleResetPlaybackRate,
    INCREASE_PLAYBACK_RATE: handleChangePlaybackRate({
      value: args.playbackRate + 0.25,
    }),
    DECREASE_PLAYBACK_RATE: handleChangePlaybackRate({
      value: args.playbackRate - 0.05,
    }),
    SET_TIME_FORWARD: handleSetTime({
      value: args.currentTime + 5,
    }),
    SET_TIME_FORWARD_FAST: handleSetTime({
      value: args.currentTime + 10,
    }),
    SET_TIME_BACKWARD: handleSetTime({
      value: args.currentTime - 5,
    }),
    SET_TIME_BACKWARD_FAST: handleSetTime({
      value: args.currentTime - 10,
    }),
    SET_TIME_TO_START: handleChangeValue({
      value: 0,
    }),
    SET_TIME_TO_10_PERCENT: handleChangeValue({
      value: args.duration * 0.1,
    }),
    SET_TIME_TO_20_PERCENT: handleChangeValue({
      value: args.duration * 0.2,
    }),
    SET_TIME_TO_30_PERCENT: handleChangeValue({
      value: args.duration * 0.3,
    }),
    SET_TIME_TO_40_PERCENT: handleChangeValue({
      value: args.duration * 0.4,
    }),
    SET_TIME_TO_50_PERCENT: handleChangeValue({
      value: args.duration * 0.5,
    }),
    SET_TIME_TO_60_PERCENT: handleChangeValue({
      value: args.duration * 0.6,
    }),
    SET_TIME_TO_70_PERCENT: handleChangeValue({
      value: args.duration * 0.7,
    }),
    SET_TIME_TO_80_PERCENT: handleChangeValue({
      value: args.duration * 0.8,
    }),
    SET_TIME_TO_90_PERCENT: handleChangeValue({
      value: args.duration * 0.9,
    }),
  };
}

type KeyHandlerArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handleSideEffect: ActionHandler<SideEffectAction>;
};

function handleTogglePlay({ event, handleSideEffect }: KeyHandlerArgs) {
  handleSideEffect({ type: "TOGGLE_PLAY" });
  event.preventDefault();
  return true;
}

function handleToggleMute({
  volume,
  unmuteVolume,
  handleSideEffect,
}: Pick<HandleMediaKeysArgs, "volume" | "unmuteVolume" | "handleSideEffect">) {
  const nextUnmuteVolume = areNumbersClose(volume, 0) ? unmuteVolume : volume;
  handleSideEffect({ type: "TOGGLE_MUTE", unmuteVolume: nextUnmuteVolume });
  return true;
}

type ChangeValueArgs = Pick<
  HandleMediaKeysArgs,
  "event" | "handleSideEffect" | "currentTime" | "playbackRate" | "component"
>;

function handleChangeValue({ value }: { value: number }) {
  return function handleChangeValue({
    handleSideEffect,
    component,
    currentTime,
    playbackRate,
  }: ChangeValueArgs) {
    const current = component === "timeline" ? currentTime : playbackRate;
    handleSideEffect({
      type: "CHANGE_VALUE",
      value,
      component: component || "timeline",
    });
    if (component === "volume") {
      handleSideEffect({
        type: "TOGGLE_MUTE",
        unmuteVolume: current,
      });
    }
    return true;
  };
}

function handleSetTime({ value }: { value: number }) {
  return function handleSetTime({ handleSideEffect }: ChangeValueArgs) {
    handleSideEffect({
      type: "CHANGE_VALUE",
      value,
      component: "timeline",
    });
    return true;
  };
}

function handleToggleCaptions({
  handlePlayerAction,
}: Pick<HandleMediaKeysArgs, "handlePlayerAction">) {
  handlePlayerAction({ type: "TOGGLE_CAPTIONS" });
  return true;
}

function handleVolumeUp({
  volume,
  handleSideEffect,
}: Pick<HandleMediaKeysArgs, "volume" | "handleSideEffect">) {
  // handlePlayerAction({ type: "UNMUTE" });
  handleSideEffect({
    type: "CHANGE_VALUE",
    value: volume + 0.025,
    component: "volume",
  });
  return true;
}

function handleChangePlaybackRate({ value }: { value: number }) {
  return function handleChangePlaybackRate({
    handleSideEffect,
  }: ChangeValueArgs) {
    handleSideEffect({
      type: "SET_PLAYBACK_RATE",
      playbackRate: value,
    });
    return true;
  };
}

function handleVolumeDown({
  volume,
  volumeState,
  handleSideEffect,
}: Pick<HandleMediaKeysArgs, "volume" | "volumeState" | "handleSideEffect">) {
  const restrictedVolume = Math.max(volume - 0.025, 0);
  if (areNumbersClose(restrictedVolume, 0) && volumeState !== "muted") {
    handleSideEffect({
      type: "SET_UNMUTE_VOLUME",
      unmuteVolume: 0.025,
    });
  }
  if (!areNumbersClose(restrictedVolume, 0)) {
    handleSideEffect({
      type: "UNMUTE",
    });
  }
  handleSideEffect({
    type: "CHANGE_VALUE",
    value: restrictedVolume,
    component: "volume",
  });
  return true;
}

function handleStopAudio({ handleSideEffect }: KeyHandlerArgs) {
  handleSideEffect({ type: "STOP_AUDIO" });
  return true;
}

function handleResetPlaybackRate({ handleSideEffect }: KeyHandlerArgs) {
  handleSideEffect({ type: "SET_PLAYBACK_RATE", playbackRate: 1 });
  return true;
}

export function handleMediaKeys(args: HandleMediaKeysArgs) {
  const { event } = args;
  const actionToFunctionMap = createActionToFunctionMap(args);

  const action = defaultKeyToActionMap[event.key];

  if (!action || !(action.type in actionToFunctionMap)) return false;
  const handler = actionToFunctionMap[action.type];

  const isHandled = handler(args);
  if (isHandled) event.preventDefault();
  return isHandled;
}

export function useHandleMediaKeys(component?: SliderComponent) {
  const {
    getPlayerState,
    playbackRate,
    volumeState,
    isMuted,
    handlePlayerAction,
  } = useContext(PlayerContext);
  const handleSideEffect = useHandleSideEffect();
  const { volumeCallbackRef } = useContext(AudioContext);
  const { duration, currentTime, volume, unmuteVolumeRef } = getPlayerState();

  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const result = handleMediaKeys({
        event,
        handleSideEffect,
        handlePlayerAction,
        playbackRate,
        volumeState,
        duration,
        currentTime,
        volume,
        unmuteVolume: unmuteVolumeRef.current,
        component,
        volumeCallbackRef,
        unmuteVolumeRef,
        isMuted,
      });

      if (result) {
        event.stopPropagation();
      }

      return result;
    },
    [
      handleSideEffect,
      handlePlayerAction,
      playbackRate,
      volumeState,
      component,
      duration,
      currentTime,
      volume,
      unmuteVolumeRef,
      volumeCallbackRef,
      isMuted,
    ],
  );
}
