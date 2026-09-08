import { Page, expect } from "@playwright/test";

/**
 * Slack for a time assertion, in **seconds** — a real element lands
 * `currentTime` a frame or two off a seek target.
 *
 * Named because these used to read `toBeCloseTo(x, 0.25)`, where 0.25 is a
 * fractional `numDigits` producing ±0.281 s: a number that looks like a
 * precision and is not one (T8).
 */
export const SEEK_TOLERANCE_S = 0.3;

/**
 * Slack for a laid-out coordinate, in pixels. Sub-pixel rounding and device pixel
 * ratio both move it, while a clamp that actually failed misses by ~100 px.
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
 * What a field has to do before the test may look at it. Exactly one of three
 * shapes: land near a value, move away from one, or fall inside bounds.
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
 * Waits until the element's field satisfies `window`, instead of sleeping.
 *
 * A media element is not predictable enough for a fixed wait: `play()` resolves
 * asynchronously, decode start is unbounded, and a write reaches the UI only
 * once the element echoes its event back through the store. A 50–100 ms sleep
 * passes on an idle laptop and races on a loaded CI box (T7).
 *
 * Use the *loosest* window that means "the gesture landed" and leave the precise
 * expectation to the assertion after it. Otherwise both test the same thing and
 * only the wait can fail.
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
 * Waits until the element is playing, or paused. The click handler does not await
 * `play()`, so `paused` flips some time after the click.
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

/**
 * Clamps a pointer target into the viewport.
 *
 * Overshooting a slider's bounds is the point of a clamp test, but Playwright's
 * Firefox substitutes `clientX = 0` for a position outside the viewport and
 * dispatches **no `pointerup` at all** for a release outside it — which leaves
 * the drag live and poisons every later test in the file. Overshoot inside the
 * window instead: a pixel short of the edge is still well outside any track.
 */
export function insideViewport(page: Page, x: number): number {
  const width = page.viewportSize()?.width ?? 1280;
  return Math.min(Math.max(x, 0), width - 1);
}

/**
 * Resolves once the track has data, and throws if it never will.
 *
 * Every caller passes a src that is meant to load, so a failure is a broken
 * fixture or a missing decoder — not something to wait out. Resolving on
 * `error` here instead hid that: the setup passed and the spec failed later on
 * a clock that never moved, which says nothing about why.
 */
export async function waitForAudio(page: Page) {
  const failure = await page.evaluate(() => {
    return new Promise<string | null>((resolve) => {
      const audio = document.querySelector("audio");
      if (!audio) {
        resolve("no <audio> element on the page");
        return;
      }
      const describe = () =>
        `code ${audio.error?.code ?? "none"}, readyState ${audio.readyState}, src ${audio.currentSrc || audio.src}`;
      if (audio.readyState >= 2) {
        resolve(null);
        return;
      }
      audio.addEventListener("loadeddata", () => resolve(null), { once: true });
      audio.addEventListener("error", () => resolve(describe()), {
        once: true,
      });
    });
  });

  if (failure) {
    throw new Error(`waitForAudio: the track failed to load — ${failure}`);
  }
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
