import { test, expect, Page } from "@playwright/test";
import { getAudioState, waitForAudio } from "./test-utils";

const PRECISION = 0.25;

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

test("seek to 10% of the timeline when 1 is pressed", async () => {
  await page.getByLabel("Seek forward by 10 seconds").focus();
  await page.keyboard.press("1");
  const { currentTime, duration } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(duration * 0.1, PRECISION);
});

test("seek 5 seconds forward when right arrow is pressed", async ({ page }) => {
  // Reset state
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel("Seek forward by 10 seconds").focus();
  await page.keyboard.press("ArrowRight");
  const { currentTime } = await getAudioState(page);

  expect(currentTime).toBeCloseTo(5, PRECISION);
});

test("seek 5 seconds backward when left arrow is pressed", async () => {
  // Reset state
  await page.goto("/");
  await waitForAudio(page);

  // Move forward 10 seconds (two 5-second jumps)
  await page.getByLabel("Seek forward by 10 seconds").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  // Then move back 5 seconds
  await page.keyboard.press("ArrowLeft");

  const { currentTime } = await getAudioState(page);

  expect(currentTime).toBeCloseTo(5, PRECISION);
});

test("seek 10 seconds forward when L key is pressed", async () => {
  // Reset state
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel("Seek forward by 10 seconds").focus();
  await page.keyboard.press("l");

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(10, PRECISION);
});

test("seek 10 seconds backward when J key is pressed", async () => {
  // Reset state
  await page.goto("/");
  await waitForAudio(page);

  // Move forward 20 seconds (two 10-second jumps)
  await page.getByLabel("Seek forward by 10 seconds").focus();
  await page.keyboard.press("l");
  await page.keyboard.press("l");

  // Then move back 10 seconds
  await page.keyboard.press("j");

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(10, PRECISION);
});

test("progress indicator initial state", async () => {
  const progressIndicator = page.getByLabel("Audio progress");
  await expect(progressIndicator).toHaveAttribute("role", "progressbar");
  await expect(progressIndicator).toHaveAttribute("aria-valuemin", "0");
  await expect(progressIndicator).toHaveAttribute("aria-valuenow", "10");
});
