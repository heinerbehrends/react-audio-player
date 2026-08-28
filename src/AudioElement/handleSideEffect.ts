import { areNumbersClose } from "../Shared/sharedFunctions";
import type { SideEffectAction } from "./sideEffectActions";

/**
 * Media properties throw on an out-of-range write rather than clamping, and
 * each accepts a different range:
 *
 * - `volume` — [0, 1]; outside throws `IndexSizeError`
 * - `playbackRate` — [0, 16] in Chrome; outside throws `NotSupportedError`
 * - `currentTime` — any finite number, clamped to [0, duration] by the browser;
 *   `NaN` throws `TypeError`
 *
 * Sliders clamp by construction, so only consumer input arrives unguarded.
 * Non-finite values are dropped rather than clamped: `NaN` has no meaningful
 * target, and usually means `duration` was read before metadata.
 */
const MAX_PLAYBACK_RATE = 16;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function writeVolume(audioElement: HTMLAudioElement, value: number) {
  if (!Number.isFinite(value)) return;
  audioElement.volume = clamp(value, 0, 1);
}

function writeRate(audioElement: HTMLAudioElement, value: number) {
  if (!Number.isFinite(value)) return;
  audioElement.playbackRate = clamp(value, 0, MAX_PLAYBACK_RATE);
}

function writeTime(audioElement: HTMLAudioElement, value: number) {
  if (!Number.isFinite(value)) return;
  audioElement.currentTime = value;
}

/**
 * The store state the write path needs. A snapshot rather than an accessor:
 * only `TOGGLE_MUTE` and `UNMUTE` read it.
 */
export type SideEffectContext = {
  lastAudibleVolume: number;
};

/**
 * `play()` resolves once playback starts and rejects when the browser refuses —
 * `NotAllowedError` under autoplay policy, `AbortError` when a `pause()` or a
 * `src` change interrupts it. It returns `undefined` rather than a promise in
 * jsdom and in browsers predating the promise form, so the result is normalised
 * before being handed to the caller.
 */
function play(audioElement: HTMLAudioElement): Promise<void> {
  return Promise.resolve(audioElement.play());
}

/**
 * Returns the pending `play()` promise for the two actions that start playback,
 * so the store can record a refusal. Every other action returns `undefined`.
 */
export function handleSideEffect(
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null,
  context: SideEffectContext,
): Promise<void> | undefined {
  if (!audioElement) return undefined;
  switch (action.type) {
    case "PLAY": {
      return play(audioElement);
    }
    case "PAUSE": {
      audioElement.pause();
      break;
    }
    case "TOGGLE_PLAY": {
      if (audioElement.paused) {
        return play(audioElement);
      }
      audioElement.pause();
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
        unmute(audioElement, context);
        break;
      }
      audioElement.muted = true;
      break;
    }
    case "UNMUTE": {
      unmute(audioElement, context);
      break;
    }
    case "CHANGE_VALUE": {
      switch (action.component) {
        case "timeline": {
          writeTime(audioElement, action.value);
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
          writeVolume(audioElement, action.value);
          break;
        }
        case "playbackRate": {
          writeRate(audioElement, action.value);
          break;
        }
      }
      break;
    }
    case "SET_PLAYBACK_RATE": {
      writeRate(audioElement, action.playbackRate);
      break;
    }
    case "INCREASE_VOLUME": {
      writeVolume(audioElement, audioElement.volume + action.value);
      break;
    }
    case "DECREASE_VOLUME": {
      const newVolume = Math.max(audioElement.volume - action.value, 0);
      if (areNumbersClose(newVolume, 0)) {
        audioElement.muted = true;
        return undefined;
      }
      writeVolume(audioElement, newVolume);
      break;
    }
    case "INCREASE_PLAYBACK_RATE": {
      writeRate(
        audioElement,
        Math.min(audioElement.playbackRate + action.value, 4),
      );
      break;
    }
    case "DECREASE_PLAYBACK_RATE": {
      writeRate(
        audioElement,
        Math.max(audioElement.playbackRate - action.value, 0.5),
      );
      break;
    }
    case "RESET_PLAYBACK_RATE": {
      audioElement.playbackRate = 1;
      break;
    }
    case "SET_TIME_FORWARD": {
      writeTime(
        audioElement,
        Math.min(
          audioElement.currentTime + action.value,
          audioElement.duration,
        ),
      );
      break;
    }
    case "SET_TIME_BACKWARD": {
      writeTime(
        audioElement,
        Math.max(audioElement.currentTime - action.value, 0),
      );
      break;
    }
    case "SET_TIME_TO_START": {
      audioElement.currentTime = 0;
      break;
    }
    case "SET_TIME_TO_PERCENT": {
      writeTime(audioElement, audioElement.duration * action.percent);
      break;
    }
  }
  return undefined;
}

/**
 * Unmuting a player whose volume is zero has to restore a volume too, or it
 * stays silent. `lastAudibleVolume` covers every path that got it there: drag,
 * click, keyboard, or a consumer's `CHANGE_VALUE`.
 */
function unmute(
  audioElement: HTMLAudioElement,
  { lastAudibleVolume }: SideEffectContext,
) {
  if (areNumbersClose(audioElement.volume, 0)) {
    writeVolume(audioElement, lastAudibleVolume);
  }
  audioElement.muted = false;
}
