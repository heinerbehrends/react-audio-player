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

async function setRate(rate: number) {
  await page.evaluate((next) => {
    const audio = document.querySelector("audio");
    if (audio) audio.playbackRate = next;
  }, rate);
  await page.waitForTimeout(50);
}

test("dragging the rate thumb lands on a 0.1 step", async () => {
  await setRate(1);
  const box = await page.getByLabel(labels.playbackRate).boundingBox();
  if (!box) throw new Error("rate slider has no box");
  const y = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.33, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.66, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);

  // The demo slider runs 0.5 to 2 in steps of 0.1.
  const { playbackRate } = await getAudioState(page);
  expect(playbackRate).toBeGreaterThanOrEqual(0.5);
  expect(playbackRate).toBeLessThanOrEqual(2);
  expect(playbackRate * 10).toBeCloseTo(Math.round(playbackRate * 10), 5);
});

test("PlaybackRate.Set writes the rate and marks itself current", async () => {
  await setRate(1);

  const setToOneAndAHalf = page.getByRole("button", {
    name: "Set playback rate to 1.5x",
  });
  await setToOneAndAHalf.click();
  await page.waitForTimeout(80);

  expect((await getAudioState(page)).playbackRate).toBeCloseTo(1.5, 5);
  await expect(setToOneAndAHalf).toHaveAttribute("aria-current", "true");
  await expect(
    page.getByRole("button", { name: "Set playback rate to 1x" }),
  ).not.toHaveAttribute("aria-current", "true");
});

test("PlaybackRate.Display follows the element", async () => {
  await setRate(1);

  await page
    .getByRole("button", { name: "Increase playback rate by 0.1x" })
    .click();
  await page.waitForTimeout(80);

  await expect(page.getByLabel("Current playback rate")).toHaveText("1.1x");
});
