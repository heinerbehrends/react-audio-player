import {
  areNumbersClose,
  calculateSliderValue,
} from "../Shared/sharedFunctions";
import type { SideEffectAction } from "./sideEffectActions";

export function handleSideEffect(
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null,
) {
  console.log("handleSideEffect", action);
  if (!audioElement) return;
  switch (action.type) {
    case "PLAY": {
      audioElement.play();
      break;
    }
    case "PAUSE": {
      audioElement.pause();
      break;
    }
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
    case "SET_SLIDER_VALUE": {
      if (action.component === "timeline") {
        const time = calculateSliderValue({
          clientXY: action.clientXY,
          sliderLength: action.sliderLength,
          maxValue: action.maxValue,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
          step: action.step,
        });
        audioElement.currentTime = time;
      }
      if (action.component === "volume") {
        const volume = calculateSliderValue({
          clientXY: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
        });
        audioElement.volume = volume;
      }
      if (action.component === "playbackRate") {
        const playbackRate = calculateSliderValue({
          clientXY: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          minValue: action.minValue,
          maxValue: action.maxValue,
          step: action.step,
        });
        audioElement.playbackRate = playbackRate;
      }
      break;
    }
    case "DRAG_END": {
      if (action.component === "timeline") {
        const time = calculateSliderValue({
          clientXY: action.clientXY - action.offsetFromMiddle,
          sliderLength: action.sliderLength,
          maxValue: action.maxValue,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
          step: action.step,
        });
        audioElement.currentTime = time;
      }
      if (action.component === "volume") {
        return;
      }
      if (action.component === "playbackRate") {
        return;
      }
      break;
    }
    case "CHANGE_VALUE": {
      if (action.component === "timeline") {
        audioElement.currentTime = action.value;
      }
      if (action.component === "volume") {
        const isCloseToZero = areNumbersClose(action.value, 0);
        if (audioElement.muted && !isCloseToZero) {
          audioElement.muted = false;
        }
        audioElement.volume = action.value;
      }
      if (action.component === "playbackRate") {
        audioElement.playbackRate = action.value;
      }
      break;
    }
    case "DRAG": {
      if (action.component === "timeline") {
        return;
      }
      if (action.component === "volume") {
        const volume = calculateSliderValue({
          clientXY: action.clientXY - action.offsetFromMiddle,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
        });
        audioElement.muted = false;
        audioElement.volume = volume;
      }
      if (action.component === "playbackRate") {
        const step = action.step || 0.25;
        const minValue = action.minValue || 0.5;
        const maxValue = action.maxValue || 4;
        const playbackRate = calculateSliderValue({
          minValue,
          maxValue,
          step,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          clientXY: action.clientXY,
        });

        audioElement.playbackRate = playbackRate;
      }
      break;
    }
    case "SET_PLAYBACK_RATE": {
      audioElement.playbackRate = action.playbackRate;
      break;
    }
  }
}
