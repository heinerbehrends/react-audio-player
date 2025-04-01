import { useCallback, useContext } from "react";
import {
  PlayerContext,
  type PlayerProviderAction,
} from "./Player/PlayerContext";

type ActionHandler<T> = (action: T) => void;

type HandleKeyDownProps = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  getPlayerState: () => {
    duration: number;
    currentTime: number;
    volume: number;
    playbackRate: number;
  };
  type: "timeline" | "volume";
};

export function handleTimelineKeys({
  event,
  handlePlayerAction,
  getPlayerState,
  type,
}: HandleKeyDownProps) {
  if (
    handleMediaKeys({
      event,
      handlePlayerAction,
      getPlayerState,
      isVolume: type === "volume",
    })
  ) {
    return;
  }
  const { duration } = getPlayerState();
  if (isNumericKey(event.key)) {
    const value = getNumericKeyValue({
      type,
      duration,
      key: event.key,
    });
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: type });
    event.preventDefault();
    return true;
  }

  if (["Enter", " "].includes(event.key)) {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
    event.preventDefault();
    return true;
  }
  return false;
}

export function handleMediaKeys({
  event,
  handlePlayerAction,
  getPlayerState,
  isVolume = false,
}: Omit<HandleKeyDownProps, "handleTimelineAction" | "type"> & {
  isVolume?: boolean;
}) {
  const { duration, currentTime, volume, playbackRate } = getPlayerState();
  if (["m", "MediaMute"].includes(event.key.toLowerCase())) {
    handlePlayerAction({ type: "TOGGLE_MUTE" });
    event.preventDefault();
    return true;
  }
  if (["p", "k", "MediaPlayPause"].includes(event.key.toLowerCase())) {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
    event.preventDefault();
    return true;
  }
  if (event.key.toLowerCase() === "l") {
    const value = Math.min(duration, currentTime + 10);
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: "timeline" });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowRight") {
    if (isVolume) return false;
    const value = Math.min(duration, currentTime + 5);
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: "timeline" });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowLeft") {
    if (isVolume) return false;
    const value = Math.max(0, currentTime - 5);
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: "timeline" });
    event.preventDefault();
    return true;
  }
  if (event.key.toLowerCase() === "j") {
    const value = Math.max(0, currentTime - 10);
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: "timeline" });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowDown") {
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: volume - 0.025,
      component: "volume",
    });
    event.preventDefault();
    return true;
  }
  if (event.key === "ArrowUp") {
    handlePlayerAction({
      type: "CHANGE_VALUE",
      value: volume + 0.025,
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
  if (isNumericKey(event.key) && !isVolume) {
    const value = getNumericKeyValue({
      type: "timeline",
      duration,
      key: event.key,
    });
    handlePlayerAction({ type: "CHANGE_VALUE", value, component: "timeline" });
    event.preventDefault();
    return true;
  }
  if ([">", "]"].includes(event.key)) {
    const newRate = playbackRate + 0.25;
    const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
    });
    event.preventDefault();
    return true;
  }
  if (["<", "["].includes(event.key)) {
    const newRate = playbackRate - 0.25;
    const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
    handlePlayerAction({
      type: "SET_PLAYBACK_RATE",
      playbackRate: limitedRate,
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

type getNumericKeyValueProps = {
  type: "timeline" | "volume";
  duration: number;
  key: NumericKey;
};

function getNumericKeyValue({ type, duration, key }: getNumericKeyValueProps) {
  const keyToTimeMap = {
    timeline: {
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
    },
    volume: {
      "0": 0,
      "1": 0.1,
      "2": 0.2,
      "3": 0.3,
      "4": 0.4,
      "5": 0.5,
      "6": 0.6,
      "7": 0.7,
      "8": 0.8,
      "9": 0.9,
    },
  };
  return keyToTimeMap[type][key];
}

export function useHandleMediaKeys() {
  const { handlePlayerAction, getPlayerState } = useContext(PlayerContext);
  return useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      handleMediaKeys({ event, handlePlayerAction, getPlayerState });
    },
    [handlePlayerAction, getPlayerState]
  );
}
