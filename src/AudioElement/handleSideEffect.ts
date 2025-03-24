import type { SideEffectAction } from "./AudioContext";

export function handleSideEffect(
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null
) {
  if (!audioElement) return;
  switch (action.type) {
    case "TOGGLE_PLAY": {
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
      break;
    }
    case "AUDIO_FILE_ENDED": 
    case "STOP_AUDIO": {
      audioElement.currentTime = 0;
      audioElement.pause();
      break;
    }
    case "TOGGLE_MUTE": {
      audioElement.muted = !audioElement.muted;
      break;
    }
    case "DRAG_END":
    case "SEEK_TO_TIME": {
      if (action.component === "timeline") {
        audioElement.currentTime = action.time;
      }
      if (action.component === "volume") {
        audioElement.volume = action.time;
      }
      break;
    }
    case "DRAG": {
      if (action.component === "timeline") {
        return;
      }
      audioElement.volume = action.time;
      break;
    }
  }
}
