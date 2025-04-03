import { test, expect, Page } from "@playwright/test";
import { waitForAudio } from "./test-utils";

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
  const playButton = page.getByRole("button", { name: /Play/ });
  await expect(playButton).toBeVisible();
  await expect(playButton).toBeEnabled();
  await expect(playButton).toHaveAttribute("aria-label", "Play audio");
  // Click the play button
  await playButton.click();
  const pauseButton = page.getByRole("button", { name: /Pause/ });
  await expect(pauseButton).toBeVisible();
  await expect(pauseButton).toBeEnabled();
  await expect(pauseButton).toHaveAttribute("aria-label", "Pause audio");
  const isPlaying = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return audio && !audio.paused;
  });
  await expect(isPlaying).toBe(true);

  // Click the pause button
  await pauseButton.click();
  await expect(playButton).toBeVisible();
  await expect(playButton).toBeEnabled();
  await expect(playButton).toHaveAttribute("aria-label", "Play audio");
  const isPaused = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return audio && audio.paused;
  });
  await expect(isPaused).toBe(true);
});

  test("The play button receives focus and can be used with keyboard", async () => {
    await page.evaluate(() => {
      const playButton = document.querySelector(
        'button[aria-label="Play audio"]'
      );
      if (playButton instanceof HTMLElement) {
        playButton.focus();
      }
    });
    const playButton = page.getByRole("button", { name: /Play/ });
    await expect(playButton).toBeFocused();
    await page.keyboard.press("Enter");
    const pauseButton = page.getByRole("button", { name: /Pause/ });
    await expect(pauseButton).toBeFocused();
    await page.keyboard.press("Space");
    await expect(playButton).toBeFocused();
  });
