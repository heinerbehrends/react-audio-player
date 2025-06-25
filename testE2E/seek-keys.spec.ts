import { test, expect, Page } from "@playwright/test";
import { getAudioState, waitForAudio } from "./test-utils";
import { labels } from "./test-utils";

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
  await page.getByLabel(labels.seekForward).focus();
  await page.keyboard.press("1");
  const { currentTime, duration } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(duration * 0.1, PRECISION);
});

test("seek 5 seconds forward when right arrow is pressed", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel(labels.seekForward).focus();
  await page.keyboard.press("ArrowRight");
  const { currentTime } = await getAudioState(page);

  expect(currentTime).toBeCloseTo(5, PRECISION);
});

test("seek 5 seconds backward when left arrow is pressed", async () => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel(labels.seekForward).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  await page.keyboard.press("ArrowLeft");

  const { currentTime } = await getAudioState(page);

  expect(currentTime).toBeCloseTo(5, PRECISION);
});

test("seek 10 seconds forward when L key is pressed", async () => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel(labels.seekForward).focus();
  await page.keyboard.press("l");

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(10, PRECISION);
});

test("seek 10 seconds backward when J key is pressed", async () => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByLabel(labels.seekForward).focus();
  await page.keyboard.press("l");
  await page.keyboard.press("l");

  await page.keyboard.press("j");

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(10, PRECISION);
});

test("progress indicator initial state", async () => {
  const progressIndicator = page.getByLabel(labels.timeline);
  await expect(progressIndicator).toHaveAttribute("role", "slider");
  await expect(progressIndicator).toHaveAttribute("aria-valuemin", "0");
  await expect(progressIndicator).toHaveAttribute("aria-valuenow", "1");
});
