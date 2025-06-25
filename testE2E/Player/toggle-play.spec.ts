import { test, expect, Page } from "@playwright/test";
import { waitForAudio, resetAudioState, labels } from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

test("toggle play button has correct name and aria attributes and works", async () => {
  await resetAudioState(page);

  const playButton = page.getByRole("button", { name: /Play/ });
  await expect(playButton).toBeVisible();
  await expect(playButton).toBeEnabled();
  await expect(playButton).toHaveAttribute("aria-label", labels.playAudio);

  await playButton.click();

  // Wait for audio to start playing
  await page.waitForTimeout(100);

  const pauseButton = page.getByRole("button", { name: /Pause/ });
  await expect(pauseButton).toBeVisible();
  await expect(pauseButton).toBeEnabled();
  await expect(pauseButton).toHaveAttribute("aria-label", labels.pauseAudio);
  const isPlaying = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return audio && !audio.paused;
  });
  await expect(isPlaying).toBe(true);

  await pauseButton.click();

  // Wait for audio to pause
  await page.waitForTimeout(100);

  await expect(playButton).toBeVisible();
  await expect(playButton).toBeEnabled();
  await expect(playButton).toHaveAttribute("aria-label", labels.playAudio);
  const isPaused = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return audio && audio.paused;
  });
  await expect(isPaused).toBe(true);
});

test("The play button receives focus and can be used with keyboard", async () => {
  await resetAudioState(page);

  await page.evaluate((playAudioLabel) => {
    const playButton = document.querySelector(
      `button[aria-label="${playAudioLabel}"]`,
    );
    if (playButton instanceof HTMLElement) {
      playButton.focus();
    }
  }, labels.playAudio);
  const playButton = page.getByRole("button", { name: /Play/ });
  await expect(playButton).toBeFocused();
  await page.keyboard.press("Enter");

  // Wait for audio to start playing
  await page.waitForTimeout(100);

  const pauseButton = page.getByRole("button", { name: /Pause/ });
  await expect(pauseButton).toBeFocused();
  await page.keyboard.press("Space");

  // Wait for audio to pause
  await page.waitForTimeout(100);

  await expect(playButton).toBeFocused();
});
