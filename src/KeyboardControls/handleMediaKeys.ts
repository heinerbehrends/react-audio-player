import { VolumeState } from "../Player/PlayerContext";
import { areNumbersClose } from "../Shared/sharedFunctions";
import { HandleKeyDownProps } from "./handleSliderKeys";

export function handleMediaKeys({
  event,
  handlePlayerAction,
  getPlayerState,
  isVolume = false,
  playbackRate,
  volumeState,
}: Omit<HandleKeyDownProps, "handleTimelineAction" | "type"> & {
  isVolume?: boolean;
  playbackRate: number;
  volumeState: VolumeState;
}) {
  const {
    duration,
    currentTime,
    volume,
    unmuteVolumeRef: unmuteVolume,
  } = getPlayerState();
  if (["m", "MediaMute"].includes(event.key.toLowerCase())) {
    const nextVolume = areNumbersClose(volume, 0)
      ? unmuteVolume.current
      : volume;
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
    const restrictedVolume = Math.max(volume - 0.025, 0);
    if (areNumbersClose(restrictedVolume, 0) && volumeState !== "muted") {
      handlePlayerAction({
        type: "SET_UNMUTE_VOLUME",
        unmuteVolume: 0.025,
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
