import { test, expect, Page } from "@playwright/test";
import { waitForAudio } from "./test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test("progress indicator initial state", async () => {
  const progressIndicator = page.getByRole("progressbar");
  await expect(progressIndicator).toBeEnabled();
  await expect(progressIndicator).toHaveAttribute(
    "aria-label",
    /audio progress/
  );
  await expect(progressIndicator).toHaveAttribute("aria-valuemin", "0");
  await expect(progressIndicator).toHaveAttribute("aria-valuenow", "0");
});

test("progress indicator updates on audio playback", async () => {
  const progressIndicator = page.getByRole("progressbar");
  await expect(progressIndicator).toBeEnabled();

  const playButton = page.getByRole("button", { name: /Play/ });
  await playButton.click();

  const pauseButton = page.getByRole("button", { name: /Pause/ });
  await pauseButton.click();

  const [currentTime, duration] = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    return [audio?.currentTime, audio?.duration];
  });
  await expect(progressIndicator).toHaveAttribute(
    "aria-valuemax",
    (duration ?? "").toString()
  );

  const progressValue = await progressIndicator.getAttribute("aria-valuenow");
  const progressNumber = parseFloat(progressValue ?? "0");
  expect(Math.abs(progressNumber - (currentTime ?? 0))).toBeCloseTo(0, 0.25);

  const [progressWidth, parentWidth] = await page.evaluate(() => {
    const progress = document.querySelector('[role="progressbar"]');
    const parent = progress?.parentElement;
    const progressWidth = progress?.getBoundingClientRect().width ?? 0;
    const parentWidth = parent?.getBoundingClientRect().width ?? 1;
    return [progressWidth, parentWidth];
  });
  const actualRatio = progressWidth / parentWidth;
  const expectedRatio = (currentTime ?? 0) / (duration ?? 1);
  expect(Math.abs(actualRatio - expectedRatio)).toBeCloseTo(0, 0.25);
});
