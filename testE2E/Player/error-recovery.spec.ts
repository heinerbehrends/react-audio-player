import { test, expect, Page } from "@playwright/test";
import { labels } from "../test-utils";

let page: Page;

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterEach(async () => {
  await page.close();
});

/**
 * Swaps the `?src=` param without a page load, so the second half of this spec
 * exercises the `loadState` reset on `loadstart` rather than a fresh mount. The
 * demo app reads the URL through a `popstate` listener, which `pushState` does
 * not fire on its own.
 */
async function swapSrc(src: string) {
  await page.evaluate((next) => {
    history.pushState({}, "", `/?src=${next}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, src);
}

const errorMessage = () => page.getByRole("alert");
const playButton = () =>
  page.getByRole("button", {
    name: /^(Play audio|Pause audio|Loading audio|Error loading audio)$/,
  });

test("a bad src shows the error message and disables the controls", async () => {
  await page.goto("/?src=does-not-exist.mp3");

  await expect(errorMessage()).toBeVisible();
  await expect(errorMessage()).toHaveAttribute("aria-live", "assertive");
  await expect(playButton()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: labels.seekForward }),
  ).toBeDisabled();
});

/**
 * The live bug the `loadState` machine fixes: `AUDIO_FILE_ERROR` set
 * `playerState: "error"` permanently and `AUDIO_FILE_LOADED` only recovered from
 * `"loading"`, so a failed src followed by a good one stayed broken forever.
 */
test("swapping in a good src clears the error and re-enables the controls", async () => {
  await page.goto("/?src=does-not-exist.mp3");
  await expect(errorMessage()).toBeVisible();

  await swapSrc("The-Race.mp3");

  await expect(errorMessage()).toBeHidden();
  await expect(
    page.getByRole("button", { name: labels.playAudio }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: labels.seekForward }),
  ).toBeEnabled();
});
