import { test, expect, Page } from "@playwright/test";
import { getAudioState, labels, waitForAudio } from "../test-utils";

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
 * The element parks at the end rather than being rewound, which is what
 * `<audio>` does unaided and what every streaming player shows. A consumer's
 * `onEnded` can therefore still read where playback stopped.
 */
test("playing to the end parks at the end, paused", async () => {
  const { duration } = await getAudioState(page);
  expect(duration).toBeGreaterThan(1);

  // Start just before the end rather than playing the whole track.
  await page.evaluate((seconds) => {
    const audio = document.querySelector("audio");
    if (audio) audio.currentTime = seconds;
  }, duration - 0.3);

  await page.getByRole("button", { name: labels.playAudio }).click();

  await page.waitForFunction(
    () => document.querySelector("audio")?.ended === true,
    undefined,
    { timeout: 5000 },
  );

  const afterEnd = await getAudioState(page);
  expect(afterEnd.isPlaying).toBe(false);
  // At or fractionally past it: Chrome parks a little beyond `duration`.
  expect(afterEnd.currentTime).toBeGreaterThanOrEqual(duration - 0.01);

  // The clock and the thumb both show the end, not a start they never reached.
  await expect(page.getByLabel(labels.timeline)).toHaveAttribute(
    "aria-valuenow",
    String(Math.floor(duration)),
  );
});

/**
 * Why the rewind was not needed: the platform already does it, at the point it
 * actually matters. Pressing Play on an ended element seeks to 0 itself.
 */
test("pressing play after the end restarts the track", async () => {
  await page.getByRole("button", { name: labels.playAudio }).click();

  await page.waitForFunction(
    () => {
      const audio = document.querySelector("audio");
      return !!audio && !audio.paused && audio.currentTime < 5;
    },
    undefined,
    { timeout: 5000 },
  );

  const restarted = await getAudioState(page);
  expect(restarted.currentTime).toBeLessThan(5);
  expect(restarted.isPlaying).toBe(true);

  await page.getByRole("button", { name: labels.pauseAudio }).click();
});
