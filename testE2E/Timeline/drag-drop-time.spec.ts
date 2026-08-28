import { test, expect } from "@playwright/test";
import {
  insideViewport,
  LAYOUT_TOLERANCE_PX,
  expectNear,
  getAudioState,
  getTimelineState,
  testIds,
  waitForAudio,
} from "../test-utils";

test("drag timeline button to seek when paused", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  const dragButton = await page.getByTestId(testIds.timelineDragThumb);

  const { sliderLength, duration } = await getTimelineState(page);

  await dragButton.hover();
  await page.mouse.down();

  const { sliderStart } = await getTimelineState(page);
  await page.mouse.move(sliderStart + sliderLength / 2, 0);
  await page.mouse.up();

  const { currentTime } = await getAudioState(page);
  expectNear(currentTime, duration / 2);
});

test("drag timeline button to seek while playing", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByRole("button", { name: "Play audio" }).click();

  const { sliderLength, duration, sliderStart, currentTime } =
    await getTimelineState(page);

  const currentOffset = (currentTime / duration) * sliderLength;
  const buttonX = sliderStart + currentOffset;
  const buttonY = await page.evaluate(() => {
    const button = document.querySelector(
      '[data-testid="timeline-drag-thumb"]',
    );
    return button?.getBoundingClientRect().top ?? 0;
  });

  await page.mouse.move(buttonX, buttonY);
  await page.mouse.down();

  const { currentTime: currentTimeUpdated } = await getAudioState(page);

  expectNear(currentTimeUpdated, currentTime);

  const { isPlaying } = await getAudioState(page);
  expect(isPlaying).toBe(true);
});

test("drag button cannot move beyond timeline bounds", async ({ page }) => {
  const BUTTON_OFFSET = 20;
  await page.goto("/");
  await waitForAudio(page);

  const { sliderStart, sliderLength } = await getTimelineState(page);

  const dragButton = page.getByTestId(testIds.timelineDragThumb);
  const initialBox = await dragButton.boundingBox();

  await dragButton.hover();
  await page.mouse.down();
  await page.mouse.move(
    insideViewport(page, sliderStart - 100),
    initialBox?.y ?? 0,
  );

  let buttonBox = await dragButton.boundingBox();

  expectNear(
    buttonBox?.x ?? 0,
    sliderStart - BUTTON_OFFSET,
    LAYOUT_TOLERANCE_PX,
  );

  await page.mouse.move(
    insideViewport(page, sliderStart + sliderLength + 100),
    initialBox?.y ?? 0,
  );
  buttonBox = await dragButton.boundingBox();
  expectNear(
    buttonBox?.x ?? 0,
    sliderStart + sliderLength - BUTTON_OFFSET,
    LAYOUT_TOLERANCE_PX,
  );
});
