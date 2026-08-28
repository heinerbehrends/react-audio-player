import { test, expect, Page } from "@playwright/test";
import {
  getAudioState,
  labels,
  resetAudioState,
  waitForAudio,
  waitForAudioField,
} from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await waitForAudio(page);
});

test.afterAll(async () => {
  await page.close();
});

// The toggle's name flips with the display, so match either. The `<time>`
// elements are named "elapsed" and "remaining", hence `exact` on those queries.
const toggle = () =>
  page.getByRole("button", {
    name: new RegExp(`^(${labels.showElapsed}|${labels.showRemaining})$`),
  });

async function seekTo(seconds: number) {
  await page.evaluate((next) => {
    const audio = document.querySelector("audio");
    if (audio) audio.currentTime = next;
  }, seconds);
  // Assigning `currentTime` is synchronous, so waiting for the element to report
  // it back proves little. This spec reads rendered text, driven by
  // `currentSecond`, which the store reaches only on `seeked` / `timeupdate` —
  // so wait for that projection too. The timeline's `aria-valuenow` *is*
  // `currentSecond` in seek mode, and is present whichever readout is shown.
  await waitForAudioField(page, "currentTime", { near: seconds, within: 0.5 });
  await expect(page.getByLabel(labels.timeline)).toHaveAttribute(
    "aria-valuenow",
    String(Math.floor(seconds)),
  );
}

async function ensureElapsedShown() {
  if (await page.getByLabel("remaining", { exact: true }).isVisible()) {
    await toggle().click();
    await expect(page.getByLabel("elapsed", { exact: true })).toBeVisible();
  }
}

test("elapsed advances during playback", async () => {
  await resetAudioState(page);
  await ensureElapsedShown();
  await expect(page.getByLabel("elapsed", { exact: true })).toHaveText("0:00");

  await page.getByRole("button", { name: labels.playAudio }).click();
  await expect(page.getByLabel("elapsed", { exact: true })).not.toHaveText(
    "0:00",
    {
      timeout: 4000,
    },
  );
  await page.getByRole("button", { name: labels.pauseAudio }).click();

  const { currentTime } = await getAudioState(page);
  expect(currentTime).toBeGreaterThan(0);
});

test("duration renders the track length", async () => {
  const { duration } = await getAudioState(page);
  const minutes = Math.floor(Math.round(duration) / 60);
  const seconds = Math.round(duration) % 60;

  await expect(page.getByLabel("duration", { exact: true })).toHaveText(
    `${minutes}:${seconds.toString().padStart(2, "0")}`,
  );
});

/** `remaining` has to count down, not sit at the constant track length. */
test("toggling shows remaining, and it counts down", async () => {
  await ensureElapsedShown();
  await seekTo(10);

  await toggle().click();

  const remaining = page.getByLabel("remaining", { exact: true });
  await expect(remaining).toBeVisible();
  await expect(page.getByLabel("elapsed", { exact: true })).toBeHidden();
  // Showing remaining, so the toggle now offers the way back.
  await expect(toggle()).toHaveAccessibleName(labels.showElapsed);

  const first = await remaining.textContent();

  await seekTo(40);
  const second = await remaining.textContent();

  expect(first).not.toBe(second);
  expect(secondsOf(second)).toBeLessThan(secondsOf(first));

  // Back to elapsed, so the rest of the suite starts where it expects to.
  await toggle().click();
});

/** `-M:SS` or `-H:MM:SS` to a total in seconds. */
function secondsOf(text: string | null): number {
  const parts = (text ?? "").replace("-", "").split(":").map(Number);
  return parts.reduce((total, part) => total * 60 + part, 0);
}
