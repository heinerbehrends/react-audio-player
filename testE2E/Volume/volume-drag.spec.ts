import { test, expect, Page } from "@playwright/test";
import {
  insideViewport,
  getAudioState,
  labels,
  testIds,
  waitForAudio,
  waitForAudioField,
  waitForMuted,
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

async function setVolume(volume: number) {
  await page.evaluate((next) => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.muted = false;
      audio.volume = next;
    }
  }, volume);
  await waitForAudioField(page, "volume", { near: volume, within: 1e-6 });
  await waitForMuted(page, false);
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
  await waitForAudioField(page, "volume", { differsFrom: 0.8 });

  expect((await getAudioState(page)).volume).toBeCloseTo(0.25, 1);
});

test("dragging the thumb to zero mutes", async () => {
  await setVolume(0.8);
  const box = await trackBox();
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(insideViewport(page, box.x - 50), y, { steps: 10 });
  await page.mouse.up();
  await waitForMuted(page, true);

  const { volume, muted } = await getAudioState(page);
  expect(volume).toBeCloseTo(0, 2);
  expect(muted).toBe(true);
});

/**
 * `useSlider` subtracts the grab offset in every mode, so grabbing the thumb
 * off-centre must not jump the value on the first move.
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
  // A one-pixel drag, so "moved at all" is the whole of what can be waited for.
  await waitForAudioField(page, "volume", { differsFrom: 0.5 });

  const { volume } = await getAudioState(page);
  const onePixel = 1 / box.width;
  expect(volume - 0.5).toBeLessThan(onePixel * 3);
  expect(volume).toBeGreaterThan(0.5);
});
