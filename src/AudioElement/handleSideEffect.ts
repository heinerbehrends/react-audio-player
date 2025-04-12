import { calculateVolume } from "../Shared/sharedFunctions";
import { calculateTime } from "../Shared/sharedFunctions";
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
      if (audioElement.muted) {
        audioElement.volume = action.unmuteVolume;
      }
      audioElement.muted = !audioElement.muted;
      break;
    }
    case "UNMUTE": {
      audioElement.muted = false;
      break;
    }
    case "DRAG_END": {
      if (action.component === "timeline") {
        const time = calculateTime({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          duration: action.duration,
          sliderStart: action.sliderStart,
        });
        const limitedTime = Math.min(Math.max(time, 0), audioElement.duration);
        audioElement.currentTime = limitedTime;
      }
      if (action.component === "volume") {
        const volume = calculateVolume({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
        });
        const limitedVolume = Math.min(Math.max(volume, 0), 1);
        audioElement.volume = limitedVolume;
      }
      break;
    }
    case "CHANGE_VALUE": {
      if (action.component === "timeline") {
        const limitedTime = Math.min(
          Math.max(action.value, 0),
          audioElement.duration
        );
        audioElement.currentTime = limitedTime;
      }
      if (action.component === "volume") {
        const limitedVolume = Math.min(Math.max(action.value, 0), 1);
        audioElement.volume = limitedVolume;
      }
      break;
    }
    case "DRAG": {
      if (action.component === "timeline") {
        return;
      }
      const volume = calculateVolume({
        xyOffset: action.clientXY,
        sliderLength: action.sliderLength,
        sliderStart: action.sliderStart,
        orientation: action.orientation,
      });
      const limitedVolume = Math.min(Math.max(volume, 0), 1);
      audioElement.volume = limitedVolume;
      break;
    }
    case "SET_PLAYBACK_RATE": {
      const limitedRate = Math.min(Math.max(action.playbackRate, 0.5), 4);
      audioElement.playbackRate = limitedRate;
      break;
    }
  }
}
