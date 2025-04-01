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
      console.log("TOGGLE_MUTE", audioElement.muted);
      audioElement.muted = !audioElement.muted;
      break;
    }
    case "UNMUTE": {
      audioElement.muted = false;
      break;
    }
    case "DRAG_END":
    case "SEEK_TO_TIME": {
      if (action.component === "timeline") {
        audioElement.currentTime = action.value;
      }
      if (action.component === "volume") {
        audioElement.volume = action.value;
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
    case "SET_PLAYBACK_RATE": {
      console.log("SET_PLAYBACK_RATE", action);
      audioElement.playbackRate = action.playbackRate;
      break;
    }
  }
}
