import { test, expect } from "@playwright/test";
import {
  waitForAudio,
  getTimelineState,
  getAudioState,
  getButtonPosition,
} from "./test-utils";

const PRECISION = 0.25;

test("drag timeline button to seek when paused", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  const dragButton = await page.getByLabel("Drag to seek");

  // Get the timeline width and audio duration
  const { timelineWidth, duration } = await getTimelineState(page);

  // Click anywhere on the button and drag
  await dragButton.hover();
  await page.mouse.down();

  // Move halfway across the timeline
  const { timelineLeft } = await getTimelineState(page);
  await page.mouse.move(timelineLeft + timelineWidth / 2, 0);
  await page.mouse.up();

  // Verify the audio time was updated
  const { currentTime } = await getAudioState(page);
  console.log("currentTime", currentTime);
  console.log("duration", duration);
  // Should be at approximately half duration
  expect(currentTime).toBeCloseTo(duration / 2, PRECISION);
});

test("drag timeline button to seek while playing", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  // Start playing
  await page.getByRole("button", { name: "Play audio" }).click();

  // Get the timeline state
  const { timelineWidth, duration, timelineLeft, currentTime } =
    await getTimelineState(page);

  // Calculate where the button should be
  const currentOffset = (currentTime / duration) * timelineWidth;
  const buttonX = timelineLeft + currentOffset;
  const buttonY = await page.evaluate(() => {
    const button = document.querySelector("[aria-label='Drag to seek']");
    return button?.getBoundingClientRect().top ?? 0;
  });

  // Move to button position and start drag
  await page.mouse.move(buttonX, buttonY);
  await page.mouse.down();

  // Verify the audio time was updated
  const { currentTime: currentTimeUpdated } = await getAudioState(page);

  // Should be at approximately current time
  expect(currentTimeUpdated).toBeCloseTo(currentTime, PRECISION);

  // Verify audio is still playing
  const { isPlaying } = await getAudioState(page);
  expect(isPlaying).toBe(true);
});

test("drag button cannot move beyond timeline bounds", async ({ page }) => {
  const BUTTON_OFFSET = 20;
  await page.goto("/");
  await waitForAudio(page);

  // Get the timeline dimensions
  const { timelineLeft, timelineWidth } = await getTimelineState(page);

  const dragButton = await page.getByLabel("Drag to seek");
  await dragButton.hover();
  await page.mouse.down();

  // Try to drag before the start of timeline
  await page.mouse.move(timelineLeft - 100, 0);

  // Get button position, should be at start
  let buttonLeft = await getButtonPosition(page);
  // Button should be at start of timeline (minus its offset)
  expect(buttonLeft).toBeCloseTo(timelineLeft - BUTTON_OFFSET, 1);
  await page.mouse.up();
  await dragButton.hover();
  await page.mouse.down();
  // Try to drag past end of timeline
  await page.mouse.move(timelineLeft + timelineWidth + 100, 0);
  await page.mouse.up();
  // Get button position, should be at end
  buttonLeft = await getButtonPosition(page);

  // Button should be at end of timeline (minus its offset)
  expect(buttonLeft).toBeCloseTo(timelineLeft + timelineWidth - BUTTON_OFFSET, 1);

  // await page.mouse.up();

  // Verify audio times
  const { currentTime, duration } = await getAudioState(page);
  console.log("currentTime", currentTime);
  console.log("duration", duration);
  // Should be at beginning of timeline, because we return to the start when the audio file ends
  expect(currentTime).toBeCloseTo(0, PRECISION);
});
