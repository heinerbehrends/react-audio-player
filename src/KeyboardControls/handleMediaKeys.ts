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

export function handleMediaKeys({
  event,
  handlePlayerAction,
  component,
  playbackRate,
  volumeState,
  duration,
  currentTime,
  volume,
  unmuteVolume,
}: HandleMediaKeysArgs) {
  if (component) {
    if (["Enter", " "].includes(event.key)) {
      handlePlayerAction({ type: "TOGGLE_PLAY" });
      event.preventDefault();
      return true;
    }
  }
  if (["m", "MediaMute"].includes(event.key.toLowerCase())) {
    const nextVolume = areNumbersClose(volume, 0) ? unmuteVolume : volume;
    handlePlayerAction({ type: "TOGGLE_MUTE", unmuteVolume: nextVolume });
    event.preventDefault();
    return true;
  }
  if (["p", "k", "MediaPlayPause"].includes(event.key.toLowerCase())) {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
    event.preventDefault();
    return true;
  }
  if (event.key.toLowerCase() === "l") {
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: currentTime + 10,
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowRight") {
    if (component === "volume") return;
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: currentTime + 5,
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowLeft") {
    if (component === "volume") return;
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: currentTime - 5,
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  if (event.key.toLowerCase() === "j") {
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: currentTime - 10,
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowUp") {
    handlePlayerAction({ type: "UNMUTE" });
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: volume + 0.025,
      component: "volume",
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowDown") {
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
    event.preventDefault();
    return true;
  }
  if (["s", "MediaStop"].includes(event.key.toLowerCase())) {
    handlePlayerAction({
      type: "STOP_AUDIO",
    });
    event.preventDefault();
    return true;
  }
  if (isNumericKey(event.key)) {
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: getNumericKeyValue({
        duration,
        key: event.key,
      }),
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  if ([">", "]"].includes(event.key)) {
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: playbackRate + 0.25,
    });
    event.preventDefault();
    return true;
  }
  if (["<", "["].includes(event.key)) {
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: playbackRate - 0.25,
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "Backspace") {
    handlePlayerAction({ type: "SET_PLAYBACK_RATE", playbackRate: 1 });
    event.preventDefault();
    return true;
  }
  return false;
}

function isNumericKey(key: string): key is NumericKey {
  return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key);
}

type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type GetNumericKeyValueArgs = {
  key: NumericKey;
  duration: number;
};

function getNumericKeyValue({ duration, key }: GetNumericKeyValueArgs) {
  const keyToTimeMap = {
    "0": 0,
    "1": duration * 0.1,
    "2": duration * 0.2,
    "3": duration * 0.3,
    "4": duration * 0.4,
    "5": duration * 0.5,
    "6": duration * 0.6,
    "7": duration * 0.7,
    "8": duration * 0.8,
    "9": duration * 0.9,
  };

  return keyToTimeMap[key];
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
