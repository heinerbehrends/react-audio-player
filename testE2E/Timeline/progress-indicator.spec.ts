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
 * `scaleX` out of the fill's computed transform — how full the bar is drawn.
 * Selected through the library's own `data-part`, scoped by the slider's
 * accessible name so the volume and rate fills do not match.
 */
const FILL = `[aria-label="${labels.timeline}"] [data-part="progress"]`;

async function fillFraction() {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error("no progress fill matched " + selector);
    return new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
  }, FILL);
}

test("progress indicator initial state", async () => {
  const timeline = page.getByLabel(labels.timeline);

  await expect(timeline).toHaveAttribute("role", "slider");
  await expect(timeline).toHaveAttribute("aria-valuemin", "0");
  await expect(timeline).toHaveAttribute("aria-valuenow", "0");
  expect(await fillFraction()).toBeCloseTo(0, 3);
});

test("aria-valuemax is the real duration", async () => {
  const { duration } = await getAudioState(page);

  await expect(page.getByLabel(labels.timeline)).toHaveAttribute(
    "aria-valuemax",
    duration.toString(),
  );
});

/**
 * Plays until the value actually moves rather than waiting a fixed 100 ms.
 * `aria-valuenow` is floor-quantised to whole seconds, so after 100 ms it is
 * still `"0"` — the old version compared that to a `currentTime` of ~0.1 under
 * a ±0.28 tolerance and passed whatever the slider did. Freezing the attribute
 * at zero permanently would not have failed it.
 */
test("progress indicator updates on audio playback", async () => {
  const timeline = page.getByLabel(labels.timeline);
  await expect(timeline).toHaveAttribute("aria-valuenow", "0");

  await page.getByRole("button", { name: labels.playAudio }).click();
  await expect(timeline).not.toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: labels.pauseAudio }).click();

  const { currentTime, duration } = await getAudioState(page);

  // Like for like: the attribute is quantised, so compare it to the quantised
  // element time rather than to the raw float.
  await expect(timeline).toHaveAttribute(
    "aria-valuenow",
    Math.floor(currentTime).toString(),
  );

  // The fill is driven by the unquantised value and carries a 250 ms
  // transition, so it is allowed to lag the element — but it must have moved,
  // and must not have run past the position.
  const fraction = await fillFraction();
  expect(fraction).toBeGreaterThan(0);
  expect(fraction).toBeLessThanOrEqual(currentTime / duration + 0.01);
});
