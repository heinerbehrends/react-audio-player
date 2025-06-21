import {
  areNumbersClose,
  calculateSliderValue,
} from "../Shared/sharedFunctions";
import type { SideEffectAction } from "./sideEffectActions";

export function handleSideEffect(
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null,
) {
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
      const dragStartVolume = audioElement.dataset["dragStartVolume"];
      if (dragStartVolume && audioElement.muted) {
        audioElement.volume = Number(dragStartVolume);
      }
      audioElement.muted = !audioElement.muted;
      delete audioElement.dataset["dragStartVolume"];
      break;
    }
    case "UNMUTE": {
      const dragStartVolume = audioElement.dataset["dragStartVolume"];
      if (dragStartVolume && audioElement.muted) {
        audioElement.volume = Number(dragStartVolume);
      }
      audioElement.muted = false;
      delete audioElement.dataset["dragStartVolume"];
      break;
    }
    case "SET_SLIDER_VALUE": {
      switch (action.component) {
        case "timeline": {
          const time = calculateSliderValue({
            clientXY: action.clientXY,
            sliderLength: action.sliderLength,
            maxValue: action.maxValue,
            sliderStart: action.sliderStart,
            orientation: action.orientation,
            step: action.step,
          });
          audioElement.currentTime = time;
          break;
        }
        case "volume": {
          const volume = calculateSliderValue({
            clientXY: action.clientXY,
            sliderLength: action.sliderLength,
            sliderStart: action.sliderStart,
            orientation: action.orientation,
          });
          audioElement.volume = volume;
          break;
        }
        case "playbackRate": {
          const playbackRate = calculateSliderValue({
            clientXY: action.clientXY,
            sliderLength: action.sliderLength,
            sliderStart: action.sliderStart,
            minValue: action.minValue,
            maxValue: action.maxValue,
            step: action.step,
          });
          audioElement.playbackRate = playbackRate;
          break;
        }
      }
      break;
    }
    case "DRAG_START": {
      if (action.component === "volume") {
        // Store the current volume when starting to drag
        audioElement.dataset["dragStartVolume"] =
          audioElement.volume.toString();
      }
      break;
    }
    case "DRAG_END": {
      switch (action.component) {
        case "timeline": {
          const time = calculateSliderValue({
            clientXY: action.clientXY - action.offsetFromMiddle,
            sliderLength: action.sliderLength,
            maxValue: action.maxValue,
            sliderStart: action.sliderStart,
            orientation: action.orientation,
            step: action.step,
          });
          audioElement.currentTime = time;
          break;
        }
        case "volume": {
          if (areNumbersClose(audioElement.volume, 0)) {
            audioElement.muted = true;
          }
          break;
        }
        case "playbackRate": {
          return;
        }
      }
      break;
    }
    case "CHANGE_VALUE": {
      switch (action.component) {
        case "timeline": {
          audioElement.currentTime = action.value;
          break;
        }
        case "volume": {
          const isCloseToZero = areNumbersClose(action.value, 0);
          if (audioElement.muted && !isCloseToZero) {
            audioElement.muted = false;
          }
          if (isCloseToZero) {
            audioElement.muted = true;
          }
          audioElement.volume = action.value;
          break;
        }
        case "playbackRate": {
          audioElement.playbackRate = action.value;
          break;
        }
      }
      break;
    }
    case "DRAG": {
      switch (action.component) {
        case "timeline": {
          return;
        }
        case "volume": {
          const volume = calculateSliderValue({
            clientXY: action.clientXY - action.offsetFromMiddle,
            sliderLength: action.sliderLength,
            sliderStart: action.sliderStart,
            orientation: action.orientation,
          });
          audioElement.muted = false;
          audioElement.volume = volume;
          break;
        }
        case "playbackRate": {
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
          break;
        }
      }
      break;
    }
    case "SET_PLAYBACK_RATE": {
      audioElement.playbackRate = action.playbackRate;
      break;
    }
    case "INCREASE_VOLUME": {
      const newVolume = Math.min(audioElement.volume + action.value, 1);
      audioElement.volume = newVolume;
      break;
    }
    case "DECREASE_VOLUME": {
      const newVolume = Math.max(audioElement.volume - action.value, 0);
      const isCloseToZero = areNumbersClose(newVolume, 0);
      if (isCloseToZero) {
        audioElement.muted = true;
        return;
      }
      audioElement.volume = newVolume;
      break;
    }
    case "INCREASE_PLAYBACK_RATE": {
      const newRate = Math.min(audioElement.playbackRate + action.value, 4);
      audioElement.playbackRate = newRate;
      break;
    }
    case "DECREASE_PLAYBACK_RATE": {
      const newRate = Math.max(audioElement.playbackRate - action.value, 0.5);
      audioElement.playbackRate = newRate;
      break;
    }
    case "RESET_PLAYBACK_RATE": {
      audioElement.playbackRate = 1;
      break;
    }
    case "SET_TIME_FORWARD": {
      const newTime = Math.min(
        audioElement.currentTime + action.value,
        audioElement.duration,
      );
      audioElement.currentTime = newTime;
      break;
    }
    case "SET_TIME_BACKWARD": {
      const newTime = Math.max(audioElement.currentTime - action.value, 0);
      audioElement.currentTime = newTime;
      break;
    }
    case "SET_TIME_TO_START": {
      audioElement.currentTime = 0;
      break;
    }
    case "SET_TIME_TO_PERCENT": {
      const newTime = audioElement.duration * action.percent;
      audioElement.currentTime = newTime;
      break;
    }
  }
}
