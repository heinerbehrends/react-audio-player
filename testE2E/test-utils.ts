import { Page } from "@playwright/test";

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
};

// The drag thumbs are aria-hidden pointer affordances -- the slider semantics
// live on the slider element -- so E2E targets them via the demo app test hook.
export const testIds = {
  timelineDragThumb: "timeline-drag-thumb",
};
