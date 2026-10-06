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

  test("previous keeps focus on reaching the first track", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });
    const previous = example.getByRole("button", { name: "Previous track" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");

    await example.getByRole("button", { name: "Next track" }).click();
    await expect(previous).toHaveAttribute("aria-disabled", "false");
    await previous.focus();
    await page.keyboard.press("Enter");

    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      example.getByRole("button", { name: /Down the Rabbit-Hole/ }),
    ).toHaveAttribute("aria-current", "true");
  });

  // Previous and next are the example's own buttons, so only
  // `useMediaKeyHandler` on the root gives them the shortcuts.
  test("the shortcuts work with a custom button focused", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: "Next track" }).focus();
    await page.keyboard.press("k");

    await expect.poll(() => isPlaying(example)).toBe(true);
    await page.keyboard.press("k");
    await expect.poll(() => isPlaying(example)).toBe(false);
  });

  // `tabIndex={-1}` on the root: a click on something that is not a control
  // focuses the player rather than the page, so the shortcuts still work.
  test("the shortcuts work after a click on the cover", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.locator(".playlist-cover").click();
    await expect(
      example.getByRole("region", { name: "Down the Rabbit-Hole" }),
    ).toBeFocused();
    await page.keyboard.press("k");

    await expect.poll(() => isPlaying(example)).toBe(true);
    // Space too, with the container itself focused.
    await page.keyboard.press(" ");
    await expect.poll(() => isPlaying(example)).toBe(false);
  });

  // A1: on a button, Space presses it rather than toggling playback.
  test("Space on a focused button presses it", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Playlist" });

    await example.getByRole("button", { name: "Next track" }).focus();
    await page.keyboard.press(" ");

    await expect(
      example.getByRole("button", { name: /The Pool of Tears/ }),
    ).toHaveAttribute("aria-current", "true");
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
    await expect.poll(() => volumeWidth(example)).toBe(0);

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

  // Opening moves the mute button left. Hovered above the 20px slider, the
  // pointer then hovered nothing, the slider closed, and the button slid back
  // under it — a flicker for as long as the pointer stayed.
  test("stays open with the pointer near the mute button's top edge", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Basic player" });
    const mute = example.getByRole("button", { name: labels.mute });
    const box = (await mute.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + 3);
    await expect.poll(() => volumeWidth(example)).toBeGreaterThan(40);

    const widths: number[] = [];
    for (let sample = 0; sample < 10; sample += 1) {
      await page.waitForTimeout(100);
      widths.push(await volumeWidth(example));
    }
    expect(Math.min(...widths)).toBeGreaterThan(40);
  });

  test.describe("on a touch screen", () => {
    // Touch emulation is what makes `(hover: none)` match.
    test.use({ hasTouch: true, isMobile: true });

    test("the volume slider is open without hover", async ({ page }) => {
      await page.goto("/");
      const example = page.getByRole("region", { name: "Basic player" });

      await expect.poll(() => volumeWidth(example)).toBeGreaterThan(40);
    });
  });
});
