import { test, expect } from "@playwright/test";
import { labels, waitForAudio, waitForPlaying } from "../test-utils";

/**
 * The metadata is the one part of the session page script can read back. Action
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
