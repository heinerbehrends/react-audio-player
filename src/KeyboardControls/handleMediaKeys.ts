import { useContext, useCallback } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { PlayerProviderAction, VolumeState } from "../Player/PlayerContext";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { SliderComponent } from "../Slider/SliderContext";

type ActionHandler<Action> = (action: Action) => void;

export type HandleMediaKeysArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  duration: number;
  currentTime: number;
  volume: number;
  unmuteVolume: number;
  playbackRate: number;
  volumeState: VolumeState;
  component?: SliderComponent | undefined;
};

// First define the action types
type KeyAction =
  | "TOGGLE_PLAY"
  | "STOP"
  | "TOGGLE_MUTE"
  | "INCREASE_VOLUME"
  | "DECREASE_VOLUME"
  | "INCREASE_PLAYBACK_RATE"
  | "DECREASE_PLAYBACK_RATE"
  | "RESET_PLAYBACK_RATE"
  | "SET_TIME_FORWARD"
  | "SET_TIME_FORWARD_FAST"
  | "SET_TIME_BACKWARD"
  | "SET_TIME_BACKWARD_FAST"
  | "SET_TIME_TO_START"
  | "SET_TIME_TO_10_PERCENT"
  | "SET_TIME_TO_20_PERCENT"
  | "SET_TIME_TO_30_PERCENT"
  | "SET_TIME_TO_40_PERCENT"
  | "SET_TIME_TO_50_PERCENT"
  | "SET_TIME_TO_60_PERCENT"
  | "SET_TIME_TO_70_PERCENT"
  | "SET_TIME_TO_80_PERCENT"
  | "SET_TIME_TO_90_PERCENT"
  | "TOGGLE_CAPTIONS";

// Then use it in the map type
type KeyToActionMap = {
  [key: string]: KeyAction;
};

const defaultKeyToActionMap: KeyToActionMap = {
  p: "TOGGLE_PLAY",
  P: "TOGGLE_PLAY",
  k: "TOGGLE_PLAY",
  K: "TOGGLE_PLAY",
  MediaPlayPause: "TOGGLE_PLAY",
  " ": "TOGGLE_PLAY",
  s: "STOP",
  S: "STOP",
  MediaStop: "STOP",
  m: "TOGGLE_MUTE",
  M: "TOGGLE_MUTE",
  MediaMute: "TOGGLE_MUTE",
  l: "SET_TIME_FORWARD_FAST",
  L: "SET_TIME_FORWARD_FAST",
  ArrowRight: "SET_TIME_FORWARD",
  ArrowLeft: "SET_TIME_BACKWARD",
  MediaVolumeUp: "INCREASE_VOLUME",
  ArrowUp: "INCREASE_VOLUME",
  MediaVolumeDown: "DECREASE_VOLUME",
  ArrowDown: "DECREASE_VOLUME",
  j: "SET_TIME_BACKWARD_FAST",
  J: "SET_TIME_BACKWARD_FAST",
  ">": "INCREASE_PLAYBACK_RATE",
  "<": "DECREASE_PLAYBACK_RATE",
  "]": "INCREASE_PLAYBACK_RATE",
  "[": "DECREASE_PLAYBACK_RATE",
  Backspace: "RESET_PLAYBACK_RATE",
  "0": "SET_TIME_TO_START",
  "1": "SET_TIME_TO_10_PERCENT",
  "2": "SET_TIME_TO_20_PERCENT",
  "3": "SET_TIME_TO_30_PERCENT",
  "4": "SET_TIME_TO_40_PERCENT",
  "5": "SET_TIME_TO_50_PERCENT",
  "6": "SET_TIME_TO_60_PERCENT",
  "7": "SET_TIME_TO_70_PERCENT",
  "8": "SET_TIME_TO_80_PERCENT",
  "9": "SET_TIME_TO_90_PERCENT",
};

type ActionToFunctionMap = {
  [key in KeyAction]: (args: HandleMediaKeysArgs) => boolean;
};

function createActionToFunctionMap(
  args: HandleMediaKeysArgs
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
      value: args.playbackRate - 0.25,
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
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
};

function handleTogglePlay({ event, handlePlayerAction }: KeyHandlerArgs) {
  handlePlayerAction({ type: "TOGGLE_PLAY" });
  event.preventDefault();
  return true;
}

function handleToggleMute({
  volume,
  unmuteVolume,
  handlePlayerAction,
}: Pick<
  HandleMediaKeysArgs,
  "volume" | "unmuteVolume" | "handlePlayerAction"
>) {
  const nextVolume = areNumbersClose(volume, 0) ? unmuteVolume : volume;
  handlePlayerAction({ type: "TOGGLE_MUTE", unmuteVolume: nextVolume });
  return true;
}

type ChangeValueArgs = Pick<
  HandleMediaKeysArgs,
  "event" | "handlePlayerAction" | "currentTime" | "playbackRate" | "component"
>;

function handleChangeValue({ value }: { value: number }) {
  return function handleChangeValue({
    handlePlayerAction,
    component,
    currentTime,
    playbackRate,
  }: ChangeValueArgs) {
    const current = component === "timeline" ? currentTime : playbackRate;
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value,
      component: component || "timeline",
    });
    if (component === "volume") {
      handlePlayerAction({
        type: "TOGGLE_MUTE",
        unmuteVolume: current,
      });
    }
    return true;
  };
}

function handleSetTime({ value }: { value: number }) {
  return function handleSetTime({
    handlePlayerAction,
    component,
  }: ChangeValueArgs) {
    if (component === "volume") return false;
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value,
      component: component || "timeline",
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
  handlePlayerAction,
}: Pick<HandleMediaKeysArgs, "volume" | "handlePlayerAction">) {
  handlePlayerAction({ type: "UNMUTE" });
  handlePlayerAction({
    type: "CHANGE_VALUE",
    value: volume + 0.025,
    component: "volume",
  });
  return true;
}

function handleChangePlaybackRate({ value }: { value: number }) {
  return function handleChangePlaybackRate({
    handlePlayerAction,
  }: ChangeValueArgs) {
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: value,
    });
    return true;
  };
}

function handleVolumeDown({
  volume,
  volumeState,
  handlePlayerAction,
}: Pick<HandleMediaKeysArgs, "volume" | "volumeState" | "handlePlayerAction">) {
  const restrictedVolume = Math.max(volume - 0.025, 0);
  if (areNumbersClose(restrictedVolume, 0) && volumeState !== "muted") {
    handlePlayerAction({
      type: "SET_UNMUTE_VOLUME",
      unmuteVolume: 0.025,
    });
  }
  if (!areNumbersClose(restrictedVolume, 0)) {
    handlePlayerAction({
      type: "UNMUTE",
    });
  }
  handlePlayerAction({
    type: "CHANGE_VALUE",
    value: restrictedVolume,
    component: "volume",
  });
  return true;
}

function handleStopAudio({ handlePlayerAction }: KeyHandlerArgs) {
  handlePlayerAction({ type: "STOP_AUDIO" });
  return true;
}

function handleResetPlaybackRate({ handlePlayerAction }: KeyHandlerArgs) {
  handlePlayerAction({ type: "SET_PLAYBACK_RATE", playbackRate: 1 });
  return true;
}

export function handleMediaKeys(args: HandleMediaKeysArgs) {
  const { event } = args;
  const actionToFunctionMap = createActionToFunctionMap(args);

  const action = defaultKeyToActionMap[event.key];

  console.log("event.key", event.key);
  console.log("args.event.key", args.event.key);
  console.log("defaultKeyToActionMap", defaultKeyToActionMap);
  console.log("action", action);

  if (!action || !(action in actionToFunctionMap)) return false;
  const handler = actionToFunctionMap[action];
  console.log("handler", handler);
  console.log("args", args);
  const isHandled = handler(args);
  if (isHandled) event.preventDefault();
  return isHandled;
}

export function useHandleMediaKeys(component?: SliderComponent) {
  const { handlePlayerAction, getPlayerState, playbackRate, volumeState } =
    useContext(PlayerContext);
  const {
    duration,
    currentTime,
    volume,
    unmuteVolumeRef: { current: unmuteVolume },
  } = getPlayerState();
  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleMediaKeys({
        event,
        handlePlayerAction,
        playbackRate,
        volumeState,
        duration,
        currentTime,
        volume,
        unmuteVolume,
        component,
      });
    },
    [
      handlePlayerAction,
      playbackRate,
      volumeState,
      component,
      duration,
      currentTime,
      volume,
      unmuteVolume,
    ]
  );
}
