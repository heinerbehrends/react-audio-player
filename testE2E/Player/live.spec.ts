import { test, expect } from "@playwright/test";
import { labels, waitForPlaying } from "../test-utils";

/**
 * `track.live` on a finite file: the projection a stream gets from an
 * endless duration, read off the element through each browser's own event
 * order. Firefox, which reports an MP3 stream as a finite track, is the engine
 * the mark exists for.
 */
test("a source marked live offers no seeking", async ({ page }) => {
  await page.goto("/?live");
  const play = page.getByRole("button", { name: labels.playAudio });
  await play.click();
  await waitForPlaying(page);

  await expect(page.getByText("Live: true")).toBeVisible();
  await expect(
    page.getByRole("slider", { name: labels.timeline }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("button", { name: labels.seekForward }),
  ).toHaveAttribute("aria-disabled", "true");

  const audio = page.locator("audio");
  const before = await audio.evaluate((a: HTMLAudioElement) => a.currentTime);
  await page.getByRole("button", { name: labels.pauseAudio }).focus();
  await page.keyboard.press("ArrowRight");
  // `s` stops: it pauses, and has no start to rewind to.
  await page.keyboard.press("s");

  await waitForPlaying(page, false);
  const after = await audio.evaluate((a: HTMLAudioElement) => a.currentTime);
  // The 5 s jump would land well past this; a rewind would land below it.
  expect(after).toBeGreaterThanOrEqual(before);
  expect(after - before).toBeLessThan(2);
});
