import { test, expect, type Locator } from "@playwright/test";
import { labels } from "../test-utils";

/**
 * Each example on the demo page still renders and plays. A broken alias, a
 * missing track or an API change an example was not updated for fails here
 * instead of on the deployed site.
 */
for (const name of ["Basic player", "Playlist"]) {
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

  test("next while paused stays paused", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: "Next track" }).click();

    await expect(
      example.getByRole("button", { name: /The Pool of Tears/ }),
    ).toHaveAttribute("aria-current", "true");
    // Long enough for a wrongly started track to report itself.
    await page.waitForTimeout(500);
    expect(await isPlaying(example)).toBe(false);
  });

  test("a track chosen from the list plays, even when paused", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: /A Caucus-Race/ }).click();

    await expect(
      example.getByRole("button", { name: /A Caucus-Race/ }),
    ).toHaveAttribute("aria-current", "true");
    await expect.poll(() => isPlaying(example)).toBe(true);
    await expect(example.locator("audio")).toHaveAttribute(
      "src",
      /alice-03.mp3$/,
    );
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

test.describe("Basic player", () => {
  const volumeWidth = (example: Locator) =>
    example
      .getByRole("slider", { name: labels.volume })
      .evaluate((control) => control.getBoundingClientRect().width);

  test("Tab from mute opens and focuses the volume slider", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Basic player" });
    const volume = example.getByRole("slider", { name: labels.volume });
    expect(await volumeWidth(example)).toBe(0);

    await example.getByRole("button", { name: labels.mute }).focus();
    await page.keyboard.press("Tab");

    await expect(volume).toBeFocused();
    await expect.poll(() => volumeWidth(example)).toBeGreaterThan(40);
  });

  test("hovering mute opens the volume slider", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Basic player" });

    await example.getByRole("button", { name: labels.mute }).hover();

    await expect.poll(() => volumeWidth(example)).toBeGreaterThan(40);
  });
});
