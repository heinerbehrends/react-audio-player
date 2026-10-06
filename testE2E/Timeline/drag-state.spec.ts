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

/**
 * S9's P1: drag state was reachable from neither CSS nor JS, with no
 * workaround. It is a live transient, so it needs a real pointer sequence —
 * jsdom can assert the idle value and nothing past it.
 */
const timelineRoot = () =>
  page.locator(`[data-part="root"]:has([aria-label="${labels.timeline}"])`);

test("the root reports drag state through a drag and back", async () => {
  await resetAudioState(page);
  const { sliderStart, sliderLength } = await getTimelineState(page);
  const root = timelineRoot();

  await expect(root).toHaveAttribute("data-state", "idle");

  const thumb = page.getByTestId(testIds.timelineDragThumb);
  const box = await thumb.boundingBox();
  if (!box) throw new Error("timeline thumb has no box");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    sliderStart + sliderLength * 0.4,
    box.y + box.height / 2,
    {
      steps: 10,
    },
  );

  await expect(root).toHaveAttribute("data-state", "dragging");

  await page.mouse.up();

  await expect(root).toHaveAttribute("data-state", "idle");
});

test("a track click does not leave the root dragging", async () => {
  await resetAudioState(page);
  const timeline = page.getByLabel(labels.timeline);
  const box = await timeline.boundingBox();
  if (!box) throw new Error("timeline has no box");

  await timeline.click({
    position: { x: box.width * 0.6, y: box.height / 2 },
    force: true,
  });

  await expect(timelineRoot()).toHaveAttribute("data-state", "idle");
});

test("the root carries its orientation", async () => {
  await expect(timelineRoot()).toHaveAttribute(
    "data-orientation",
    "horizontal",
  );
});
