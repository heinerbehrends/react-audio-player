import { test, expect, Page } from "@playwright/test";
import { waitForAudio, getTimelineState, getAudioState } from "./test-utils";

const CLICK_OFFSET = 100;
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
  await page.getByLabel("Audio timeline").click({
    position: { x: CLICK_OFFSET, y: 0 },
  });
  const { timelineWidth, duration } = await getTimelineState(page);
  const progress = CLICK_OFFSET / timelineWidth;
  const expectedTime = duration * progress;
  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(expectedTime, PRECISION);
});

test("jumps to correct position when playing", async () => {
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByLabel("Audio timeline").click({
    position: { x: CLICK_OFFSET, y: 0 },
  });
  await page.getByRole("button", { name: "Pause" }).click();
  const { timelineWidth, duration } = await getTimelineState(page);
  const progress = CLICK_OFFSET / timelineWidth;
  const expectedTime = duration * progress;
  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(expectedTime, PRECISION);
});
