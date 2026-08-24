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

/**
 * Intended behaviour, not previous behaviour. `handleEnded` used to push the
 * timeline's UI value to 0 while the element sat at `duration`, so the thumb was
 * at the start and the clock showed the full track length — the mirror problem in
 * its most visible form. `onEnded` moves the *element* to 0 instead: `seeked`
 * fires, the atoms follow, and the thumb and the clock agree.
 */
test("playing to the end returns both the element and the clock to the start", async () => {
  const { duration } = await getAudioState(page);
  expect(duration).toBeGreaterThan(1);

  // Start just before the end rather than playing the whole track.
  await page.evaluate((seconds) => {
    const audio = document.querySelector("audio");
    if (audio) audio.currentTime = seconds;
  }, duration - 0.3);

  await page.getByRole("button", { name: labels.playAudio }).click();

  await page.waitForFunction(
    () => (document.querySelector("audio")?.currentTime ?? -1) === 0,
    undefined,
    { timeout: 5000 },
  );

  const afterEnd = await getAudioState(page);
  expect(afterEnd.currentTime).toBe(0);
  expect(afterEnd.isPlaying).toBe(false);

  // The clock reads the same zero the thumb is at, rather than the duration.
  await expect(page.getByLabel("elapsed", { exact: true })).toHaveText("0:00");
  await expect(page.getByLabel(labels.timeline)).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});
