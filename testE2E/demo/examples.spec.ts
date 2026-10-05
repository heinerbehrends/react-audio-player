import { test, expect, type Locator } from "@playwright/test";
import { labels } from "../test-utils";

/**
 * Each example on the demo page still renders and plays. A broken alias, a
 * missing track or an API change an example was not updated for fails here
 * instead of on the deployed site.
 */
for (const name of ["Minimal", "Playlist"]) {
  test(`${name} plays`, async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name });
    const timeline = example.getByRole("slider", { name: labels.timeline });

    // Enabled once the track reports a duration, so this also proves it loaded.
    await expect(timeline).not.toHaveAttribute("aria-disabled", "true");
    await example.getByRole("button", { name: labels.playAudio }).click();
    await expect
      .poll(async () => Number(await timeline.getAttribute("aria-valuenow")))
      .toBeGreaterThan(0);
  });
}

test.describe("Playlist", () => {
  const isPlaying = (example: Locator) =>
    example
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => !audio.paused);

  test("next carries on playing, and the media session follows", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: labels.playAudio }).click();
    await example.getByRole("button", { name: "Next track" }).click();

    await expect(
      example.getByRole("button", { name: /The Pool of Tears/ }),
    ).toHaveAttribute("aria-current", "true");
    await expect.poll(() => isPlaying(example)).toBe(true);
    await expect
      .poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title))
      .toBe("The Pool of Tears");
  });

  test("the end of a track starts the next", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: labels.playAudio }).click();
    await expect.poll(() => isPlaying(example)).toBe(true);
    await example.locator("audio").evaluate((audio: HTMLAudioElement) => {
      audio.currentTime = audio.duration - 0.5;
    });

    await expect(
      example.getByRole("button", { name: /The Pool of Tears/ }),
    ).toHaveAttribute("aria-current", "true");
    await expect.poll(() => isPlaying(example)).toBe(true);
  });
});
