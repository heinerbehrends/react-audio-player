import { test, expect, Page } from "@playwright/test";
import { waitForAudio, getAudioState, labels } from "../test-utils";

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
 * The volume and rate keys, end to end; `seek-keys` covers the time keys.
 *
 * The keys are handled by the focusable controls, so a button has to have focus.
 * `PlayButton` is the one every row here can use, since none of these keys
 * toggle playback.
 */
async function focusPlayButton() {
  await page.getByRole("button", { name: labels.playAudio }).focus();
}

async function setState(volume: number, rate: number) {
  await page.evaluate(
    ({ nextVolume, nextRate }) => {
      const audio = document.querySelector("audio");
      if (audio) {
        audio.muted = false;
        audio.volume = nextVolume;
        audio.playbackRate = nextRate;
      }
    },
    { nextVolume: volume, nextRate: rate },
  );
  await page.waitForTimeout(50);
}

test("Arrow Up raises the volume", async () => {
  await setState(0.5, 1);
  await focusPlayButton();

  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(50);

  expect((await getAudioState(page)).volume).toBeCloseTo(0.525, 3);
});

test("Arrow Down lowers the volume", async () => {
  await setState(0.5, 1);
  await focusPlayButton();

  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(50);

  expect((await getAudioState(page)).volume).toBeCloseTo(0.475, 3);
});

test("> raises and < lowers the playback rate", async () => {
  await setState(0.5, 1);
  await focusPlayButton();

  await page.keyboard.press(">");
  await page.waitForTimeout(50);
  expect((await getAudioState(page)).playbackRate).toBeCloseTo(1.05, 3);

  await page.keyboard.press("<");
  await page.waitForTimeout(50);
  expect((await getAudioState(page)).playbackRate).toBeCloseTo(1, 3);
});

test("Backspace resets the playback rate", async () => {
  await setState(0.5, 1.75);
  await focusPlayButton();

  await page.keyboard.press("Backspace");
  await page.waitForTimeout(50);

  expect((await getAudioState(page)).playbackRate).toBeCloseTo(1, 5);
});
