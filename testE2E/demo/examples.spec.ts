import { test, expect, type Locator } from "@playwright/test";
import { labels } from "../test-utils";

/**
 * Each example on the demo page still renders and plays. A broken alias, a
 * missing track or an API change an example was not updated for fails here
 * instead of on the deployed site.
 */
for (const name of ["Basic player", "Playlist", "Podcast", "Waveform"]) {
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
  // `<PlayerRoot>` around them gives them the shortcuts.
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

test.describe("Podcast", () => {
  const chapter = (example: Locator, title: string) =>
    example.getByRole("list", { name: "Chapters" }).getByRole("button", {
      name: new RegExp(title),
    });
  const position = (example: Locator) =>
    example
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.currentTime);

  test("a chapter click seeks there and marks it", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Podcast" });
    const timeline = example.getByRole("slider", { name: labels.timeline });
    await expect(timeline).not.toHaveAttribute("aria-disabled", "true");

    await chapter(example, "Alice's Evidence").click();

    await expect.poll(() => position(example)).toBeGreaterThan(236);
    await expect(chapter(example, "Alice's Evidence")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // The mark follows the position, not the last click.
  test("the current chapter follows a skip back", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Podcast" });
    const timeline = example.getByRole("slider", { name: labels.timeline });
    await expect(timeline).not.toHaveAttribute("aria-disabled", "true");
    await chapter(example, "Alice's Evidence").click();
    await expect.poll(() => position(example)).toBeGreaterThan(236);

    await example
      .getByRole("button", { name: "Seek backward by 15 seconds" })
      .click();

    await expect(chapter(example, "Who Stole the Tarts")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});

test.describe("Waveform", () => {
  // The bars are inside `.Control`, so the whole waveform is the track, not
  // only a strip along its bottom.
  test("a click on the waveform's upper half seeks", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Waveform" });
    const timeline = example.getByRole("slider", { name: labels.timeline });
    await expect(timeline).not.toHaveAttribute("aria-disabled", "true");

    // `mouse.click` does not scroll, and the example starts below the fold.
    await timeline.scrollIntoViewIfNeeded();
    const box = (await timeline.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, box.y + 10);

    // In seconds: `aria-valuenow` is floored, so it can sit up to a second
    // short, plus a pixel's worth of click. A fraction's tolerance would
    // depend on the track's length.
    const max = Number(await timeline.getAttribute("aria-valuemax"));
    await expect
      .poll(async () =>
        Math.abs(
          Number(await timeline.getAttribute("aria-valuenow")) - 0.6 * max,
        ),
      )
      .toBeLessThanOrEqual(2);
  });

  // S31: with a bare `1fr` grid the SVG's aspect ratio set the row's minimum,
  // and the bars grew the timeline to 519px at this width.
  test("the bars keep the height the timeline is given", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Waveform" });
    const timeline = example.getByRole("slider", { name: labels.timeline });

    await expect
      .poll(async () => (await timeline.boundingBox())?.height)
      .toBe(72);
  });
});

test.describe("Live radio", () => {
  // The station is a third party's. Served from the repo instead, so a run
  // does not depend on it; `audioFile.live` makes even a file live.
  const STREAM = "https://streams.radiomast.io/**";
  // By name: under `preload: "none"` it said "Loading audio" until pressed,
  // though nothing loaded (S34).
  const play = (example: Locator) =>
    example.getByRole("button", { name: labels.playAudio });

  test("plays on air, with no timeline", async ({ page }) => {
    await page.route(STREAM, (route) =>
      route.fulfill({ path: "public/The-Race.mp3", contentType: "audio/mpeg" }),
    );
    await page.goto("/");
    const example = page.getByRole("region", { name: "Live radio" });

    await play(example).click();

    await expect(example.locator(".live-badge")).toHaveAttribute(
      "data-on-air",
      "true",
    );
    await expect(example.locator(".live-status")).toContainText("Listening");
    await expect(
      example.getByRole("slider", { name: labels.timeline }),
    ).toHaveCount(0);
  });

  test("says so when the station does not answer", async ({ page }) => {
    await page.route(STREAM, (route) => route.abort("connectionrefused"));
    await page.goto("/");
    const example = page.getByRole("region", { name: "Live radio" });

    await play(example).click();

    await expect(example.getByRole("alert")).toBeVisible();

    // Back on air: the button reconnects without a page load.
    await page.unroute(STREAM);
    await page.route(STREAM, (route) =>
      route.fulfill({ path: "public/The-Race.mp3", contentType: "audio/mpeg" }),
    );
    await example.getByRole("button", { name: "Try again" }).click();

    await expect(example.getByRole("alert")).toHaveCount(0);
    await expect(example.locator(".live-status")).toContainText("Listening");
  });
});

// The player is labelled in German through `labels`, so its names are not the
// suite's English ones.
test.describe("Custom components", () => {
  const audio = (example: Locator) =>
    example.locator("audio").evaluate((element: HTMLAudioElement) => ({
      currentTime: element.currentTime,
      playbackRate: element.playbackRate,
      paused: element.paused,
    }));
  const play = "Audio abspielen";
  const pause = "Audio pausieren";

  // Its timeline is a native range, so it gets no `aria-valuenow` to read.
  test("plays, with every name in German", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Custom components" });
    const position = example.getByRole("slider", { name: "Position" });

    await expect(position).toBeEnabled();
    // A string entry, a function entry with a number in it, and the rate
    // button's own text, all from `labels.ts`.
    await expect(
      example.getByRole("button", { name: "30 Sekunden vor" }),
    ).toBeVisible();
    await expect(
      example.getByRole("button", { name: "Geschwindigkeit 1,5× einstellen" }),
    ).toHaveText("1,5×");

    await example.getByRole("button", { name: play }).click();
    await expect(example.getByRole("button", { name: pause })).toBeVisible();
    await expect
      .poll(async () => Number(await position.inputValue()))
      .toBeGreaterThan(0);
  });

  test("the slider seeks and the rate buttons set the rate", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Custom components" });
    const position = example.getByRole("slider", { name: "Position" });
    await expect(position).toBeEnabled();

    await position.focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(async () => (await audio(example)).currentTime)
      .toBeCloseTo(5, 0);

    const faster = example.getByRole("button", { name: /1,5/ });
    await faster.click();
    await expect(faster).toHaveAttribute("aria-pressed", "true");
    expect((await audio(example)).playbackRate).toBe(1.5);
  });

  // The root's props on the custom card bring the shortcuts.
  test("the shortcuts work from a custom button", async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Custom components" });
    await expect(
      example.getByRole("slider", { name: "Position" }),
    ).toBeEnabled();

    await example.getByRole("button", { name: /1,5/ }).focus();
    await page.keyboard.press("k");

    await expect(example.getByRole("button", { name: pause })).toBeVisible();
  });

  // `shortcuts.ts`: a rebound key, a key given a new action, and an unbound
  // one. The defaults would seek 10 s on `l`, jump to 20 % on `2` and play on
  // `p`.
  test("its own keys work, and an unbound key does nothing", async ({
    page,
  }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name: "Custom components" });
    await expect(
      example.getByRole("slider", { name: "Position" }),
    ).toBeEnabled();
    const faster = example.getByRole("button", { name: /1,5/ });
    await faster.focus();

    await page.keyboard.press("f");
    await expect
      .poll(async () => (await audio(example)).currentTime)
      .toBeCloseTo(30, 0);

    await page.keyboard.press("2");
    await expect(faster).toHaveAttribute("aria-pressed", "true");
    expect((await audio(example)).playbackRate).toBe(1.5);

    await page.keyboard.press("p");
    // Long enough for a wrongly started track to report itself.
    await page.waitForTimeout(300);
    expect((await audio(example)).paused).toBe(true);
    await expect(example.getByRole("button", { name: play })).toBeVisible();
  });
});
