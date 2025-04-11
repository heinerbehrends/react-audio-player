import { PlayerProviderAction, VolumeState } from "../Player/PlayerContext";
import { PlayerState } from "../Player/PlayerContext";
import { handleMediaKeys } from "./handleMediaKeys";

type ActionHandler<T> = (action: T) => void;

export type HandleKeyDownProps = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  getPlayerState: () => PlayerState;
  playbackRate: number;
  volumeState: VolumeState;
  type: "timeline" | "volume";
};

export function handleTimelineKeys({
  event,
  handlePlayerAction,
  getPlayerState,
  type,
  playbackRate,
  volumeState,
}: HandleKeyDownProps) {
  if (
    handleMediaKeys({
      event,
      handlePlayerAction,
      getPlayerState,
      isVolume: type === "volume",
      playbackRate,
      volumeState,
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

export function isNumericKey(key: string): key is NumericKey {
  return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key);
}

type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type getNumericKeyValueProps = {
  type: "timeline" | "volume";
  duration: number;
  key: NumericKey;
};

export function getNumericKeyValue({
  type,
  duration,
  key,
}: getNumericKeyValueProps) {
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
