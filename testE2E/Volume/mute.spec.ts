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

test("mute reports itself pressed and mutes the element", async () => {
  await setVolume(0.8);

  await muteButton().click();

  await expect(
    page.getByRole("button", { name: labels.unmute }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await getAudioState(page)).muted).toBe(true);

  await muteButton().click();

  await expect(page.getByRole("button", { name: labels.mute })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
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
 * mutes; unmuting then has to leave the player audible. The
 * `dataset.dragStartVolume` stash this replaced is gone, so a broken memory
 * shows up here as a player that unmutes to silence.
 */
test("unmuting after a drag to zero leaves the player audible", async () => {
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

  // Audible, but not necessarily the pre-drag 0.8: every `volumechange` during
  // the drag is a new "last audible volume", so the memory ends up at the last
  // non-zero sample the drag passed through. That is the named behaviour change
  // — the old `dataset` stash restored the pre-drag value instead.
  const restored = await getAudioState(page);
  expect(restored.muted).toBe(false);
  expect(restored.volume).toBeGreaterThan(0);
});
