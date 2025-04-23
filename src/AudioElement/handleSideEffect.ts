import {
  areNumbersClose,
  calculateSteppedValue,
  calculateValue,
} from "../Shared/sharedFunctions";
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
        const time = calculateValue({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          maxValue: action.maxValue,
          sliderStart: action.sliderStart,
        });
        const limitedTime = Math.min(Math.max(time, 0), action.maxValue);
        audioElement.currentTime = limitedTime;
      }
      if (action.component === "volume") {
        const volume = calculateValue({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
        });
        const limitedVolume = Math.min(Math.max(volume, 0), 1);
        audioElement.volume = limitedVolume;
      }
      if (action.component === "playbackRate") {
        // First calculate raw value between minValue and maxValue
        const value = calculateValue({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
          minValue: action.minValue,
          maxValue: action.maxValue,
        });
        const minValue = action.minValue || 0.5;
        const maxValue = action.maxValue || 4;
        const step = action.step || 0.25;
        // Calculate how many steps from minValue
        const valueRange = maxValue - minValue;
        const totalSteps = valueRange / step;
        // Calculate which step we're closest to (as a percentage of total steps)
        const percentageAlongSlider = (value - minValue) / valueRange;
        const stepIndex = Math.round(percentageAlongSlider * totalSteps);
        // Convert back to an actual value
        const steppedValue = minValue + stepIndex * step;
        const limitedValue = Math.min(
          Math.max(steppedValue, minValue),
          maxValue
        );

        audioElement.playbackRate = limitedValue;
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
        const isCloseToZero = areNumbersClose(limitedVolume, 0);
        if (audioElement.muted && !isCloseToZero) {
          audioElement.muted = false;
        }
        audioElement.volume = limitedVolume;
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
        const volume = calculateValue({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
        });
        const limitedVolume = Math.min(Math.max(volume, 0), 1);
        audioElement.volume = limitedVolume;
      }
      if (action.component === "playbackRate") {
        const value = calculateValue({
          xyOffset: action.clientXY,
          sliderLength: action.sliderLength,
          sliderStart: action.sliderStart,
          orientation: action.orientation,
          minValue: action.minValue,
          maxValue: action.maxValue,
        });
        const step = action.step || 0.25;
        const minValue = action.minValue || 0.5;
        const limitedValue = calculateSteppedValue({
          value,
          minValue,
          maxValue: action.maxValue,
          step,
        });

        audioElement.playbackRate = limitedValue;
      }
      break;
    }
  }
}
