import { TimelineProviderAction } from "../Timeline/TimelineProvider";
import { PlayerProviderAction } from "../Player/PlayerProvider";

type getArrowKeyValueProps = {
  type: "timeline" | "volume";
  duration: number;
  time: number;
  event: React.KeyboardEvent<HTMLButtonElement>;
};

function getArrowKeyValue({
  type,
  duration,
  time,
  event,
}: getArrowKeyValueProps) {
  if (type === "timeline") {
    if (event.key === "ArrowLeft") {
      return event.shiftKey ? Math.max(0, time - 2) : Math.max(0, time - 10);
    }
    if (event.key === "ArrowRight") {
      return event.shiftKey
        ? Math.min(duration, time + 2)
        : Math.min(duration, time + 10);
    }
  }
  if (type === "volume") {
    if (event.key === "ArrowDown") {
      return event.shiftKey
        ? Math.max(0, time - 0.05)
        : Math.max(0, time - 0.1);
    }
    if (event.key === "ArrowUp") {
      return event.shiftKey
        ? Math.min(1, time + 0.05)
        : Math.min(1, time + 0.1);
    }
  }
  return;
}

// Generic action handler type with proper typing
type ActionHandler<T> = (action: T) => void;

type HandleKeyDownProps = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  currentTime: number;
  duration: number;
  handleTimelineAction: ActionHandler<TimelineProviderAction>;
  handlePlayerAction: ActionHandler<PlayerProviderAction>;
  type: "timeline" | "volume";
};

export function handleTimelineKeys({
  event,
  currentTime,
  duration,
  handleTimelineAction,
  handlePlayerAction,
  type,
}: HandleKeyDownProps) {
  if (handleMediaKeys({ event, handlePlayerAction })) {
    return;
  }
  if (event.key in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
    const time = getNumericKeyValue({ type, duration, key: event.key });
    handleTimelineAction({ type: "SEEK_TO_TIME", time, component: type });
    event.preventDefault();
    return true;
  }
  if (event.key.startsWith("Arrow")) {
    const time = getArrowKeyValue({ type, duration, time: currentTime, event });
    if (!time) return;
    handleTimelineAction({ type: "SEEK_TO_TIME", time, component: type });
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

type getNumericKeyValueProps = {
  type: "timeline" | "volume";
  duration: number;
  key: string;
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
  return keyToTimeMap[type][key as keyof (typeof keyToTimeMap)[typeof type]];
}

export function handleMediaKeys({
  event,
  handlePlayerAction,
}: Omit<
  HandleKeyDownProps,
  "currentTime" | "duration" | "handleTimelineAction" | "type"
>) {
  if (["m", "MediaMute"].includes(event.key.toLowerCase())) {
    handlePlayerAction({ type: "TOGGLE_MUTE" });
    event.preventDefault();
    return true;
  }
  if (["p", "MediaPlayPause"].includes(event.key.toLowerCase())) {
    handlePlayerAction({ type: "TOGGLE_PLAY" });
    event.preventDefault();
    return true;
  }
  if (["s", "MediaStop"].includes(event.key.toLowerCase())) {
    handlePlayerAction({
      type: "SEEK_TO_TIME",
      time: 0,
      component: "timeline",
    });
    event.preventDefault();
    return true;
  }
  return false;
}
