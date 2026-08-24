import { test, expect, Page } from "@playwright/test";
import {
  waitForAudio,
  resetAudioState,
  getTimelineState,
  labels,
  testIds,
} from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

const EPSILON = 0.5;
const SAMPLE_COUNT = 10;
const SAMPLE_INTERVAL = 50;

/**
 * Sampled rather than read once: a single post-release read can land either side
 * of the element's echo and pass for the wrong reason. Ten samples over ~500 ms
 * catch a value that dips back to the pre-seek time and then recovers.
 */
async function sampleCurrentTime(): Promise<number[]> {
  const samples: number[] = [];
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    samples.push((await getTimelineState(page)).currentTime);
    await page.waitForTimeout(SAMPLE_INTERVAL);
  }
  return samples;
}

test("no sample falls back below the target after a drag release", async () => {
  await resetAudioState(page);
  const { sliderStart, sliderLength, duration } = await getTimelineState(page);
  const y = (await page.getByLabel(labels.timeline).boundingBox())!.y + 20;

  const thumb = page.getByTestId(testIds.timelineDragThumb);
  const thumbBox = await thumb.boundingBox();
  if (!thumbBox) throw new Error("timeline thumb has no box");

  const targetFraction = 0.4;
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    thumbBox.y + thumbBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(sliderStart + sliderLength * targetFraction, y, {
    steps: 10,
  });
  await page.mouse.up();

  const target = duration * targetFraction;
  const samples = await sampleCurrentTime();

  expect(samples.every((sample) => sample > target - EPSILON)).toBe(true);
});

test("no sample falls back below the target after a click to seek", async () => {
  await resetAudioState(page);
  const { duration } = await getTimelineState(page);
  const timeline = page.getByLabel(labels.timeline);
  const box = await timeline.boundingBox();
  if (!box) throw new Error("timeline has no box");

  const targetFraction = 0.6;
  await timeline.click({
    position: { x: box.width * targetFraction, y: box.height / 2 },
    force: true,
  });

  const target = duration * targetFraction;
  const samples = await sampleCurrentTime();

  expect(samples.every((sample) => sample > target - EPSILON)).toBe(true);
});
