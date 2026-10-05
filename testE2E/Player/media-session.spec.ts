import { test, expect } from "@playwright/test";
import { labels, waitForAudio, waitForPlaying } from "../test-utils";

/**
 * The metadata and the playback state are what page script can read back. Action
 * handlers have no getter, and Playwright cannot press a hardware media key, so
 * the handler path is covered in jsdom only.
 */
test("publishes the demo track's metadata to the session", async ({ page }) => {
  await page.goto("/");
  await waitForAudio(page);

  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);

  const metadata = await page.evaluate(() => {
    const current = navigator.mediaSession.metadata;
    return current && { title: current.title, artist: current.artist };
  });
  expect(metadata).toEqual({
    title: "Test tone",
    artist: "react-headless-audio-player",
  });
});

/**
 * Position state has no getter either, but a write the browser rejects would
 * surface as a development-mode console error. Polled: `audio.paused` flips on
 * the call, and the store follows the `play` / `pause` event a task later.
 */
test("follows play and pause in the playback state", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await waitForAudio(page);
  const playbackState = () =>
    page.evaluate(() => navigator.mediaSession.playbackState);
  await expect.poll(playbackState).toBe("paused");

  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);
  await page.waitForFunction(
    () => (document.querySelector("audio")?.currentTime ?? 0) > 1,
  );
  await expect.poll(playbackState).toBe("playing");

  await page.getByRole("button", { name: labels.pauseAudio }).click();
  await waitForPlaying(page, false);
  await expect.poll(playbackState).toBe("paused");
  expect(errors.filter((text) => text.includes("<MediaSession>"))).toEqual([]);
});
