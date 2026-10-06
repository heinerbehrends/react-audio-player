import { test, expect } from "@playwright/test";
import { labels, waitForPlaying } from "../test-utils";

/**
 * S34. Under `preload="none"` the element loads nothing until play is pressed:
 * `readyState` 0, `networkState` idle. The player called that "loading", so the
 * button was named "Loading audio" on a player waiting for its first press.
 */
test("a preload=none player offers play before anything has loaded", async ({
  page,
}) => {
  await page.goto("/?preload=none");
  const audio = page.locator("audio");

  // The scenario itself, so a browser that preloads anyway fails loudly here
  // rather than passing for the wrong reason.
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => [
        element.readyState,
        element.networkState,
      ]),
    )
    // HAVE_NOTHING, NETWORK_IDLE.
    .toEqual([0, 1]);

  const play = page.getByRole("button", { name: labels.playAudio });
  await expect(play).toBeVisible();

  await play.click();
  await waitForPlaying(page);
  await expect(
    page.getByRole("button", { name: labels.pauseAudio }),
  ).toBeVisible();
});
