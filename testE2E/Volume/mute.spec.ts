import { test, expect, Page } from "@playwright/test";
import { waitForAudio, getAudioState, labels } from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

/** Puts the element at a known audible, unmuted volume to start from. */
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

const muteButton = () => page.getByRole("button", { name: /^(Mute|Unmute)$/ });

test("the mute button renames itself and mutes the element", async () => {
  await setVolume(0.8);

  await muteButton().click();

  // A4: the name is the only state channel, so "Unmute" being present is the
  // assertion.
  await expect(page.getByRole("button", { name: labels.unmute })).toBeVisible();
  expect((await getAudioState(page)).muted).toBe(true);

  await muteButton().click();

  await expect(page.getByRole("button", { name: labels.mute })).toBeVisible();
  expect((await getAudioState(page)).muted).toBe(false);
});

test("clicking the track sets the volume without muting", async () => {
  await setVolume(0.8);

  const slider = page.getByLabel(labels.volume);
  const box = await slider.boundingBox();
  if (!box) throw new Error("volume slider has no box");
  await slider.click({
    position: { x: box.width * 0.25, y: box.height / 2 },
    force: true,
  });
  await page.waitForTimeout(50);

  const { volume, muted } = await getAudioState(page);
  expect(volume).toBeCloseTo(0.25, 1);
  expect(muted).toBe(false);
});

/**
 * The mute round-trip `lastAudibleVolume` has to preserve. Dragging to zero
 * mutes; unmuting then has to restore the pre-drag volume, not the last non-zero
 * sample the drag passed through.
 */
test("unmuting after a drag to zero restores the pre-drag volume", async () => {
  await setVolume(0.8);

  const slider = page.getByLabel(labels.volume);
  const box = await slider.boundingBox();
  if (!box) throw new Error("volume slider has no box");
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 50, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  const atZero = await getAudioState(page);
  expect(atZero.volume).toBeCloseTo(0, 2);
  expect(atZero.muted).toBe(true);

  await muteButton().click();
  await page.waitForTimeout(80);

  const restored = await getAudioState(page);
  expect(restored.muted).toBe(false);
  expect(restored.volume).toBeCloseTo(0.8, 2);
});
