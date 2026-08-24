import { test, expect, Page } from "@playwright/test";
import { waitForAudio, getAudioState, labels, testIds } from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

async function setVolume(volume: number) {
  await page.evaluate((next) => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.muted = false;
      audio.volume = next;
    }
  }, volume);
  await page.waitForTimeout(50);
}

async function trackBox() {
  const box = await page.getByLabel(labels.volume).boundingBox();
  if (!box) throw new Error("volume slider has no box");
  return box;
}

test("dragging the thumb to 25% sets the volume", async () => {
  await setVolume(0.8);
  const box = await trackBox();
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  expect((await getAudioState(page)).volume).toBeCloseTo(0.25, 1);
});

test("dragging the thumb to zero mutes", async () => {
  await setVolume(0.8);
  const box = await trackBox();
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 50, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  const { volume, muted } = await getAudioState(page);
  expect(volume).toBeCloseTo(0, 2);
  expect(muted).toBe(true);
});

/**
 * This row was written to pin the bug: volume and rate mode used to call
 * `calculateSliderValue` on the raw `clientXY`, so grabbing the thumb off-centre
 * jumped the value by the grab offset on the first move, while `"seek"` mode
 * subtracted it and did not. `useSlider` subtracts in every mode, so the
 * assertion is flipped — which is the point of having written it first.
 */
test("grabbing the thumb off-centre does not jump the value", async () => {
  await setVolume(0.5);
  const box = await trackBox();
  const y = box.y + box.height / 2;

  const thumb = page.getByTestId(testIds.volumeDragThumb);
  const thumbBox = await thumb.boundingBox();
  if (!thumbBox) throw new Error("volume thumb has no box");
  const thumbCentre = thumbBox.x + thumbBox.width / 2;
  const grabOffset = 15;

  // Grab 15px right of centre and move by one pixel: one pixel of pointer
  // movement is one pixel of value change, whatever the grab offset was.
  await page.mouse.move(thumbCentre + grabOffset, y);
  await page.mouse.down();
  await page.mouse.move(thumbCentre + grabOffset + 1, y, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  const { volume } = await getAudioState(page);
  const onePixel = 1 / box.width;
  expect(volume - 0.5).toBeLessThan(onePixel * 3);
  expect(volume).toBeGreaterThan(0.5);
});
