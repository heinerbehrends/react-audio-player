import type { PlayerProviderAction } from "./Player/PlayerContext";

type ActionHandler<T> = (action: T) => void;

type HandleKeyDownProps = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  type: "timeline" | "volume";
  audioElement: HTMLAudioElement | null;
};

export function handleTimelineKeys({
  event,
  handlePlayerAction,
  type,
  audioElement,
}: HandleKeyDownProps) {
  const duration = audioElement?.duration ?? 0;
  if (
    handleMediaKeys({
      event,
      handlePlayerAction,
      audioElement,
    })
  ) {
    return;
  }
  if (isNumericKey(event.key)) {
    const time = getNumericKeyValue({
      type,
      duration,
      key: event.key,
    });
    handlePlayerAction({ type: "SEEK_TO_TIME", time, component: type });
    event.preventDefault();
    return true;
  }
  if (event.key.startsWith("Arrow")) {
    console.log("event.key", event.key);
    const time = getArrowKeyValue({ type, audioElement, event });
    if (time === undefined) return;
    console.log("time", time);
    if (type === "timeline") {
      handlePlayerAction({ type: "SEEK_TO_TIME", time, component: type });
    }
    if (type === "volume") {
      handlePlayerAction({
        type: "SEEK_TO_TIME",
        time: Math.min(1, Math.max(0, time)),
        component: type,
      });
    }

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
  audioElement,
}: Omit<HandleKeyDownProps, "handleTimelineAction" | "type">) {
  const currentTime = audioElement?.currentTime ?? 0;
  const duration = audioElement?.duration ?? 0;
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
    if (!audioElement) return;
    const time = Math.min(duration, currentTime + 10);
    audioElement.currentTime = time;
    event.preventDefault();
    return true;
  }
  if (event.key.toLowerCase() === "j") {
    if (!audioElement) return;
    const time = Math.max(0, currentTime - 10);
    audioElement.currentTime = time;
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
  return false;
}

type GetArrowKeyValueProps = {
  type: "timeline" | "volume";
  audioElement: HTMLAudioElement | null;
  event: React.KeyboardEvent<HTMLButtonElement>;
};

function getArrowKeyValue({
  type,
  event,
  audioElement,
}: GetArrowKeyValueProps) {
  const time = audioElement?.currentTime ?? 0;
  const duration = audioElement?.duration ?? 0;
  if (type === "timeline") {
    if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      const newTime = event.shiftKey ? Math.max(0, time - 2) : Math.max(0, time - 10);
      console.log("newTime", newTime);
      return newTime;
    }
    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      return event.shiftKey
        ? Math.min(duration, time + 2)
        : Math.min(duration, time + 10);
    }
  }
  if (type === "volume") {
    if (["ArrowDown", "ArrowLeft"].includes(event.key)) {
      const volume = audioElement?.volume ?? 0;
      return event.shiftKey ? volume - 0.05 : volume - 0.1;
    }
    if (["ArrowUp", "ArrowRight"].includes(event.key)) {
      const volume = audioElement?.volume ?? 0;
      return event.shiftKey ? volume + 0.05 : volume + 0.1;
    }
  }
  return;
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
