import { test, expect, Page } from "@playwright/test";
import { labels, testIds } from "../test-utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/?players=2");
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("audio")).filter(
        (audio) => audio.readyState >= 2,
      ).length === 2,
  );
});

test.afterAll(async () => {
  await page.close();
});

function playerAt(index: number) {
  return page.getByTestId(testIds.player(index));
}

async function audioState() {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("audio")).map((audio) => ({
      currentTime: audio.currentTime,
      volume: audio.volume,
      paused: audio.paused,
    })),
  );
}

/**
 * The per-instance store factory. Module-level atoms would break two players on
 * one page, and the bug is invisible until a consumer hits it.
 */
test("renders two independent players", async () => {
  expect((await audioState()).length).toBe(2);
});

test("playing one player leaves the other alone", async () => {
  await playerAt(0).getByRole("button", { name: labels.playAudio }).click();

  // Wait for the element to advance rather than for a fixed interval: how long
  // decoding takes before `currentTime` moves is not ours to predict.
  await page.waitForFunction(
    () => (document.querySelectorAll("audio")[0]?.currentTime ?? 0) > 0,
    undefined,
    { timeout: 5000 },
  );

  const [first, second] = await audioState();
  expect(first!.paused).toBe(false);
  expect(first!.currentTime).toBeGreaterThan(0);
  expect(second!.paused).toBe(true);
  expect(second!.currentTime).toBe(0);

  await playerAt(0).getByRole("button", { name: labels.pauseAudio }).click();
});

test("seeking one player leaves the other alone", async () => {
  await playerAt(1).getByRole("button", { name: labels.seekForward }).click();
  await page.waitForTimeout(150);

  const [first, second] = await audioState();
  expect(second!.currentTime).toBeCloseTo(10, 0);
  expect(first!.currentTime).toBeLessThan(second!.currentTime);
});

test("each player's mute button reads its own element", async () => {
  await playerAt(0)
    .getByRole("button", { name: /^(Mute|Unmute)$/ })
    .click();
  await page.waitForTimeout(120);

  // Each button names its own element state -- see A4 for why the name is the
  // only channel. One reads "Unmute", the other still "Mute".
  await expect(
    playerAt(0).getByRole("button", { name: labels.unmute }),
  ).toBeVisible();
  await expect(
    playerAt(1).getByRole("button", { name: labels.mute }),
  ).toBeVisible();
});
