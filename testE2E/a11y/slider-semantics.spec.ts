import { test, expect } from "@playwright/test";
import {
  getAudioState,
  labels,
  resetAudioState,
  waitForAudio,
} from "../test-utils";

const PRECISION = 0.25;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);
  await resetAudioState(page);
});

test("Tab reaches the element that carries the slider role", async ({
  page,
}) => {
  const timeline = page.getByLabel(labels.timeline);
  await expect(timeline).toHaveAttribute("role", "slider");

  // The timeline is the first control in the demo app, so one Tab from the
  // document start has to land on the element that owns the slider semantics.
  await page.keyboard.press("Tab");

  await expect(timeline).toBeFocused();
});

test("the focused slider exposes a value and a value text", async ({
  page,
}) => {
  const timeline = page.getByLabel(labels.timeline);

  await timeline.focus();

  await expect(timeline).toHaveAttribute("aria-valuenow", /\d/);
  await expect(timeline).toHaveAttribute(
    "aria-valuetext",
    /^Position .+ of .+/,
  );
});

test("arrow keys on the focused slider change the value", async ({ page }) => {
  const timeline = page.getByLabel(labels.timeline);

  await timeline.focus();
  await page.keyboard.press("ArrowRight");

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeCloseTo(5, PRECISION);
  await expect(timeline).toHaveAttribute("aria-valuenow", /[^0]/);

  await page.keyboard.press("ArrowLeft");

  const { currentTime: afterLeft } = await getAudioState(page);
  expect(afterLeft).toBeCloseTo(0, PRECISION);
});

test("the drag thumb is hidden from assistive technology", async ({ page }) => {
  const thumb = page.getByTestId("timeline-drag-thumb");

  await expect(thumb).toBeVisible();
  await expect(thumb).toHaveAttribute("aria-hidden", "true");
  await expect(thumb).toHaveAttribute("tabindex", "-1");
});
