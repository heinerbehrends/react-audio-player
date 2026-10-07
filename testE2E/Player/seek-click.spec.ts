import { test, expect, Page } from "@playwright/test";
import {
  expectNear,
  getAudioState,
  labels,
  resetAudioState,
  waitForAudio,
  waitForAudioField,
  waitForPlaying,
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

test("jumps to correct position when paused", async () => {
  await resetAudioState(page);

  const seekButton = page.getByLabel(labels.seekForward);
  await seekButton.waitFor({ state: "visible" });
  await seekButton.click({ force: true });
  await waitForAudioField(page, "currentTime", { differsFrom: 0 });

  const { currentTime } = await getAudioState(page);
  expectNear(currentTime, 10);
});

test("jumps to correct position when playing", async () => {
  await resetAudioState(page);

  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);

  const seekButton = page.getByLabel(labels.seekForward);
  await seekButton.waitFor({ state: "visible" });
  await seekButton.click();

  // Let the seek land before anything else touches the element. Reading
  // straight after the pause click lost the seek on CI: the page is shared
  // with the test above, so its seek, the reset's seek to 0 and this one all
  // reached Chromium inside ~150 ms, and the position read back as 0.
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio");
    return !!audio && !audio.seeking && audio.currentTime >= 10;
  });

  await page.getByRole("button", { name: labels.pauseAudio }).click();

  // The seek is the subject; the playback between it and the pause click is
  // not. A missed seek reads near 0 and a wrong target near 20, so a bound of
  // two seconds still catches both without timing the clicks.
  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeGreaterThanOrEqual(10);
  expect(currentTime).toBeLessThan(12);
});
