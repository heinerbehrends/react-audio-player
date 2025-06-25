import { test, expect, Page } from "@playwright/test";
import {
  waitForAudio,
  getAudioState,
  resetAudioState,
  labels,
} from "../test-utils";

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

test("jumps to correct position when paused", async () => {
  await resetAudioState(page);

  const seekButton = page.getByLabel(labels.seekForward);
  await seekButton.waitFor({ state: "visible" });
  await seekButton.click({ force: true });

  await page.waitForTimeout(100);

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(10, PRECISION);
});

test("jumps to correct position when playing", async () => {
  await resetAudioState(page);

  await page.getByRole("button", { name: labels.playAudio }).click();

  // Wait for audio to start playing
  await page.waitForTimeout(100);

  const seekButton = page.getByLabel(labels.seekForward);
  await seekButton.waitFor({ state: "visible" });
  await seekButton.click({
    position: { x: 0, y: 0 },
    force: true,
  });

  await page.getByRole("button", { name: labels.pauseAudio }).click();

  const expectedTime = 10;
  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(expectedTime, PRECISION);
});
