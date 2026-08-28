import { test, expect, Page } from "@playwright/test";
import {
  waitForAudio,
  resetAudioState,
  getTimelineState,
  getButtonPosition,
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

/**
 * `aria-valuenow` is floor-quantised and a click lands within a pixel, so it
 * reads up to ~1.5 s under the target by design. A snap-back dips by the whole
 * elapsed position, so two seconds of slack still catches one.
 */
const SECONDS_EPSILON = 2;
const PIXEL_EPSILON = 5;
const SAMPLE_COUNT = 10;
const SAMPLE_INTERVAL = 50;

/**
 * Samples the UI, not the element. The snap-back is a display bug — on commit,
 * display falls back to the `currentTime` atom until `seeked` echoes ~250 ms
 * later — while `el.currentTime` is assigned synchronously and never dips, so
 * reading it cannot fail. The thumb follows the display value at event rate;
 * `Timeline.Progress` would smear the transient through its transition.
 */
async function sampleUi(): Promise<{ thumbX: number; valueNow: number }[]> {
  const samples: { thumbX: number; valueNow: number }[] = [];
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    samples.push({
      thumbX: await getButtonPosition(page),
      valueNow: Number(
        await page.getByLabel(labels.timeline).getAttribute("aria-valuenow"),
      ),
    });
    await page.waitForTimeout(SAMPLE_INTERVAL);
  }
  return samples;
}

/** The thumb is translated by half its width, so its box starts left of the value. */
async function expectedThumbX(fraction: number) {
  const { sliderStart, sliderLength } = await getTimelineState(page);
  const box = await page.getByTestId(testIds.timelineDragThumb).boundingBox();
  if (!box) throw new Error("timeline thumb has no box");
  return sliderStart + sliderLength * fraction - box.width / 2;
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
  const floor = await expectedThumbX(targetFraction);
  const samples = await sampleUi();

  expect(samples.every((s) => s.thumbX > floor - PIXEL_EPSILON)).toBe(true);
  expect(samples.every((s) => s.valueNow > target - SECONDS_EPSILON)).toBe(
    true,
  );
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
  const floor = await expectedThumbX(targetFraction);
  const samples = await sampleUi();

  expect(samples.every((s) => s.thumbX > floor - PIXEL_EPSILON)).toBe(true);
  expect(samples.every((s) => s.valueNow > target - SECONDS_EPSILON)).toBe(
    true,
  );
});
