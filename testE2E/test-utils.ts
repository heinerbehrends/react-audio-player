import { Page, expect } from "@playwright/test";

/**
 * A real media element lands `currentTime` a frame or two off a seek target, so
 * every time assertion needs a little slack. 0.3 **seconds**, written as such:
 * these assertions used to read `toBeCloseTo(x, 0.25)`, where the 0.25 is a
 * fractional `numDigits` and the tolerance it produces is ±0.281 s — a number
 * that looks like a precision and is not one (T8).
 */
export const SEEK_TOLERANCE_S = 0.3;

/**
 * A pixel budget for a laid-out coordinate: sub-pixel rounding and device pixel
 * ratio both move it, and a clamp that actually failed misses by ~100 px.
 * `toBeCloseTo(px, 1)` was ±0.05 px here — tight enough to flake on nothing.
 */
export const LAYOUT_TOLERANCE_PX = 1;

/** Asserts `actual` is within `tolerance` of `expected`, reporting both. */
export function expectNear(
  actual: number,
  expected: number,
  tolerance: number = SEEK_TOLERANCE_S,
) {
  expect(
    Math.abs(actual - expected),
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  ).toBeLessThan(tolerance);
}

/** How long any of the waits below hangs on before failing the test. */
const WAIT_TIMEOUT_MS = 5000;

type AudioNumberField = "currentTime" | "volume" | "playbackRate";

/**
 * What a numeric field has to do before the test may look at it. Exactly one of
 * the three shapes: land near a value, move away from one, or fall inside
 * bounds.
 */
type ValueWindow = {
  /** Lands within `within` of this value (default: exactly on it). */
  near?: number;
  within?: number;
  /** Or: has moved at least `by` away from this value (default: any change). */
  differsFrom?: number;
  by?: number;
  /** Or: is inside these bounds. */
  atLeast?: number;
  atMost?: number;
};

/**
 * Waits until the element's own field satisfies `window`, rather than sleeping
 * for a fixed interval and hoping.
 *
 * Nothing about a media element is predictable enough for a fixed wait:
 * `play()` resolves asynchronously, decode start is unbounded, and a write only
 * reaches the UI once the element has echoed its event back through the store.
 * A 50–100 ms sleep is a race that passes on an idle laptop and reports green on
 * a loaded CI box, which is the one failure mode worth eliminating (T7).
 *
 * Prefer the *loosest* window that means "the gesture landed", and leave the
 * precise expectation to the assertion after it — otherwise the wait and the
 * assertion test the same thing and only the wait can fail.
 */
export function waitForAudioField(
  page: Page,
  field: AudioNumberField,
  window: ValueWindow,
  timeout: number = WAIT_TIMEOUT_MS,
) {
  return page.waitForFunction(
    ({ field, window }) => {
      const audio = document.querySelector("audio");
      if (!audio) return false;
      const value = audio[field];
      if (window.near !== undefined) {
        return Math.abs(value - window.near) <= (window.within ?? 0);
      }
      if (window.differsFrom !== undefined) {
        return Math.abs(value - window.differsFrom) > (window.by ?? 0);
      }
      if (window.atLeast !== undefined && value < window.atLeast) return false;
      if (window.atMost !== undefined && value > window.atMost) return false;
      return true;
    },
    { field, window },
    { timeout },
  );
}

/**
 * Waits until the element is playing, or paused. `play()` returns a promise the
 * click handler does not await, so `paused` flips some time after the click.
 */
export function waitForPlaying(
  page: Page,
  playing: boolean = true,
  timeout: number = WAIT_TIMEOUT_MS,
) {
  return page.waitForFunction(
    (wantPlaying) => {
      const audio = document.querySelector("audio");
      return !!audio && !audio.paused === wantPlaying;
    },
    playing,
    { timeout },
  );
}

/** Waits until the element reports the mute state given. */
export function waitForMuted(
  page: Page,
  muted: boolean,
  timeout: number = WAIT_TIMEOUT_MS,
) {
  return page.waitForFunction(
    (wantMuted) => {
      const audio = document.querySelector("audio");
      return !!audio && audio.muted === wantMuted;
    },
    muted,
    { timeout },
  );
}

export async function waitForAudio(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const audio = document.querySelector("audio");
      if (!audio) {
        console.warn("No audio element found");
        resolve();
        return;
      }
      if (audio.readyState >= 2) {
        resolve();
        return;
      }
      audio.addEventListener("loadeddata", () => resolve(), { once: true });
      audio.addEventListener("error", () => resolve(), { once: true });
    });
  });
}

export async function getTimelineState(page: Page) {
  return page.evaluate(() => {
    const timeline = document.querySelector("[aria-label='Timeline slider']");
    const audio = document.querySelector("audio");
    const rect = timeline?.getBoundingClientRect();
    return {
      sliderStart: rect?.left ?? 0,
      sliderLength: rect?.width ?? 0,
      currentTime: audio?.currentTime ?? 0,
      duration: audio?.duration ?? 0,
    };
  });
}

export async function getButtonPosition(page: Page) {
  const button = page.getByTestId(testIds.timelineDragThumb);
  const boundingBox = await button.boundingBox();
  return boundingBox?.x ?? 0;
}

export async function getAudioState(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector("audio");
    return {
      currentTime: audio?.currentTime ?? 0,
      duration: audio?.duration ?? 0,
      isPlaying: audio && !audio.paused,
      volume: audio?.volume ?? 0,
      muted: audio?.muted ?? false,
      playbackRate: audio?.playbackRate ?? 1,
    };
  });
}

export async function resetAudioState(page: Page) {
  await page.evaluate(() => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.currentTime = 0;
      audio.pause();
    }
  });
}

export const labels = {
  seekForward: "Seek forward by 10 seconds",
  seekBackward: "Seek backward by 10 seconds",
  playAudio: "Play audio",
  pauseAudio: "Pause audio",
  timeline: "Timeline slider",
  volume: "Volume slider",
  playbackRate: "Playback rate slider",
  mute: "Mute",
  unmute: "Unmute",
  showElapsed: "Show time elapsed",
  showRemaining: "Show time remaining",
};

// The drag thumbs are aria-hidden pointer affordances -- the slider semantics
// live on the slider element -- so E2E targets them via the demo app test hook.
export const testIds = {
  timelineDragThumb: "timeline-drag-thumb",
  volumeDragThumb: "volume-drag-thumb",
  rateDragThumb: "rate-drag-thumb",
  player: (index: number) => `player-${index}`,
};
