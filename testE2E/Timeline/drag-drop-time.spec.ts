import { test, expect } from "@playwright/test";
import { waitForAudio, getTimelineState, getAudioState } from "../test-utils";

const PRECISION = 0.25;

test("drag timeline button to seek when paused", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  const dragButton = await page.getByLabel(
    "Drag or use left and right arrow keys to seek",
  );

  const { sliderLength, duration } = await getTimelineState(page);

  await dragButton.hover();
  await page.mouse.down();

  const { sliderStart } = await getTimelineState(page);
  await page.mouse.move(sliderStart + sliderLength / 2, 0);
  await page.mouse.up();

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(duration / 2, PRECISION);
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
      "[aria-label='Drag or use left and right arrow keys to seek']",
    );
    return button?.getBoundingClientRect().top ?? 0;
  });

  await page.mouse.move(buttonX, buttonY);
  await page.mouse.down();

  const { currentTime: currentTimeUpdated } = await getAudioState(page);

  expect(currentTimeUpdated).toBeCloseTo(currentTime, PRECISION);

  const { isPlaying } = await getAudioState(page);
  expect(isPlaying).toBe(true);
});

test("drag button cannot move beyond timeline bounds", async ({
  page,
  browserName,
}) => {
  const BUTTON_OFFSET = 20;
  await page.goto("/");
  await waitForAudio(page);

  const { sliderStart, sliderLength } = await getTimelineState(page);

  const dragButton = page.getByLabel(
    "Drag or use left and right arrow keys to seek",
  );
  const initialBox = await dragButton.boundingBox();

  await dragButton.hover();
  await page.mouse.down();
  await page.mouse.move(sliderStart - 100, initialBox?.y ?? 0);

  let buttonBox = await dragButton.boundingBox();

  expect(buttonBox?.x).toBeCloseTo(sliderStart - BUTTON_OFFSET, 1);

  // Firefox triggers onEnded, which resets the time to 0
  await page.mouse.move(sliderStart + sliderLength + 100, initialBox?.y ?? 0);
  buttonBox = await dragButton.boundingBox();
  if (browserName === "firefox") {
    expect(buttonBox?.x).toBeCloseTo(sliderStart - BUTTON_OFFSET, 1);
  } else {
    expect(buttonBox?.x).toBeCloseTo(
      sliderStart + sliderLength - BUTTON_OFFSET,
      1,
    );
  }
});
