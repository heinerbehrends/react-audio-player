import { test, expect } from "@playwright/test";
import { waitForAudio, getTimelineState, getAudioState } from "../test-utils";

const PRECISION = 0.25;

test("drag timeline button to seek when paused", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  const dragButton = await page.getByLabel("Drag to seek");

  // Get the timeline width and audio duration
  const { sliderLength, duration } = await getTimelineState(page);

  // Click anywhere on the button and drag
  await dragButton.hover();
  await page.mouse.down();

  // Move halfway across the timeline
  const { sliderStart } = await getTimelineState(page);
  await page.mouse.move(sliderStart + sliderLength / 2, 0);
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
  const { sliderLength, duration, sliderStart, currentTime } =
    await getTimelineState(page);

  // Calculate where the button should be
  const currentOffset = (currentTime / duration) * sliderLength;
  const buttonX = sliderStart + currentOffset;
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

test("drag button cannot move beyond timeline bounds", async ({
  page,
  browserName,
}) => {
  const BUTTON_OFFSET = 20;
  await page.goto("/");
  await waitForAudio(page);

  // Get the timeline dimensions
  const { sliderStart, sliderLength } = await getTimelineState(page);
  console.log("Timeline:", { sliderStart, sliderLength });

  const dragButton = page.getByLabel("Drag to seek");
  const initialBox = await dragButton.boundingBox();
  console.log("Initial button position:", initialBox);

  // Try to drag before the start of timeline
  await dragButton.hover();
  await page.mouse.down();
  await page.mouse.move(sliderStart - 100, initialBox?.y ?? 0);

  // Get button position, should be at start
  let buttonBox = await dragButton.boundingBox();
  console.log("Button at start:", buttonBox);
  expect(buttonBox?.x).toBeCloseTo(sliderStart - BUTTON_OFFSET, 1);

  // Try to drag past end of timeline
  await page.mouse.move(sliderStart + sliderLength + 100, initialBox?.y ?? 0);
  // Get button position, should be at end
  buttonBox = await dragButton.boundingBox();
  // Firefox triggers onEnded, which resets the time to 0
  if (browserName === "firefox") {
    expect(buttonBox?.x).toBeCloseTo(sliderStart - BUTTON_OFFSET, 1);
  } else {
    expect(buttonBox?.x).toBeCloseTo(
      sliderStart + sliderLength - BUTTON_OFFSET,
      1
    );
  }
});
