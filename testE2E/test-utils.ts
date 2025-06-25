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
  const button = page.getByLabel(
    "Drag or use left and right arrow keys to seek",
  );
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
    };
  });
}

export const labels = {
  seekForward: "Seek forward by 10 seconds",
  seekBackward: "Seek backward by 10 seconds",
  playAudio: "Play audio",
  pauseAudio: "Pause",
  timeline: "Timeline slider",
  dragButton: "Drag or use left and right arrow keys to seek",
};
