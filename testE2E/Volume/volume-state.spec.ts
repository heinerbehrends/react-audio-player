import { test, expect, Page } from "@playwright/test";
import {
  labels,
  waitForAudio,
  waitForAudioField,
  waitForMuted,
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

/**
 * `volumeState` derives from `volume` and `muted`, so its 0.5 boundary has no
 * stored value to diff against and can move silently.
 *
 * Scoped to the mute button: the demo's debug panel prints a volume state of its
 * own, which an unscoped text query happily matches.
 */
const muteButton = () => page.getByRole("button", { name: /^(Mute|Unmute)$/ });
const indicator = (text: string) =>
  muteButton().getByText(text, { exact: true });

async function setVolume(volume: number, muted = false) {
  await page.evaluate(
    ({ next, isMuted }) => {
      const audio = document.querySelector("audio");
      if (audio) {
        audio.muted = isMuted;
        audio.volume = next;
      }
    },
    { next: volume, isMuted: muted },
  );
  await waitForAudioField(page, "volume", { near: volume, within: 1e-6 });
  await waitForMuted(page, muted);
}

test("a volume below 0.5 renders MuteButton.LowVolume", async () => {
  await setVolume(0.4);

  await expect(indicator("Low Volume")).toBeVisible();
  await expect(indicator("High Volume")).toBeHidden();
  await expect(indicator("Muted")).toBeHidden();
});

test("a volume at or above 0.5 renders MuteButton.HighVolume", async () => {
  await setVolume(0.6);

  await expect(indicator("High Volume")).toBeVisible();
  await expect(indicator("Low Volume")).toBeHidden();
});

test("0.5 itself is high, not low", async () => {
  await setVolume(0.5);

  await expect(indicator("High Volume")).toBeVisible();
  await expect(indicator("Low Volume")).toBeHidden();
});

test("muted renders MuteButton.Muted whatever the volume", async () => {
  await setVolume(0.8, true);

  await expect(indicator("Muted")).toBeVisible();
  await expect(indicator("High Volume")).toBeHidden();
  await expect(indicator("Low Volume")).toBeHidden();
  await expect(page.getByRole("button", { name: labels.unmute })).toBeVisible();
});
