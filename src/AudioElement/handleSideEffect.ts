import { SideEffectAction } from "./AudioContext";

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
    case "TOGGLE_MUTE": {
      audioElement.muted = !audioElement.muted;
      break;
    }
    case "SEEK_TO_TIME": {
      audioElement.currentTime = action.time;
      break;
    }
    case "AUDIO_FILE_ENDED": {
      audioElement.currentTime = 0;
      break;
    }
    case "DRAG": {
      if (action.component === "timeline") {
        return;
      }
      audioElement.volume = action.time;
      break;
    }
    case "DRAG_END": {
      if (action.component === "timeline") {
        audioElement.currentTime = action.time;
      }
      break;
    }
  }
}
