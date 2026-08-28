import { test, expect, Page } from "@playwright/test";
import { waitForAudio, getAudioState, labels } from "../test-utils";

let page: Page;

// A page per test: two of these rows need `?orientation=vertical`, and the
// orientation is read once, at mount.
test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterEach(async () => {
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

test("clicking the horizontal track at 25% sets the volume", async () => {
  await page.goto("/");
  await waitForAudio(page);
  await setVolume(0.8);

  const slider = page.getByLabel(labels.volume);
  const box = await slider.boundingBox();
  if (!box) throw new Error("volume slider has no box");
  await slider.click({
    position: { x: box.width * 0.25, y: box.height / 2 },
    force: true,
  });
  await page.waitForTimeout(80);

  expect((await getAudioState(page)).volume).toBeCloseTo(0.25, 1);
});

/**
 * The inversion, end to end: a vertical volume slider runs bottom to top, so a
 * higher pointer is a higher volume. Derived from `orientation` alone.
 */
test("dragging up a vertical slider raises the volume", async () => {
  await page.goto("/?orientation=vertical");
  await waitForAudio(page);
  await setVolume(0.2);

  const box = await page.getByLabel(labels.volume).boundingBox();
  if (!box) throw new Error("volume slider has no box");
  const x = box.x + box.width / 2;
  const bottom = box.y + box.height * 0.8;
  const top = box.y + box.height * 0.2;

  await page.mouse.move(x, bottom);
  await page.mouse.down();
  await page.mouse.move(x, top, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  expect((await getAudioState(page)).volume).toBeGreaterThan(0.6);
});

test("clicking low on a vertical slider lowers the volume", async () => {
  await page.goto("/?orientation=vertical");
  await waitForAudio(page);
  await setVolume(0.9);

  const slider = page.getByLabel(labels.volume);
  const box = await slider.boundingBox();
  if (!box) throw new Error("volume slider has no box");
  await slider.click({
    position: { x: box.width / 2, y: box.height * 0.75 },
    force: true,
  });
  await page.waitForTimeout(80);

  expect((await getAudioState(page)).volume).toBeCloseTo(0.25, 1);
});
