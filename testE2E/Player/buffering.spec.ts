import { createServer, type Server, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { test, expect, type Page } from "@playwright/test";
import { labels, waitForPlaying } from "../test-utils";

/**
 * `useIsBuffering()` is derived from `readyState`, so only a real stall shows
 * whether each engine drops it below `HAVE_FUTURE_DATA` and back. The same
 * stall pins `<TimelineBuffered>` to what has arrived. The server
 * sends 8 s of the tone and holds the connection open, then sends the rest.
 */
const WAV = readFileSync("public/test-tone.wav");
// The header and 8 s of the tone: 22.05 kHz, mono, 16-bit. Less, and
// Chromium has not read the metadata when the connection goes.
const HOLD_AT = 44 + 8 * 44100;

/** `<TimelineBuffered>`'s fraction, from the custom property it sets. */
const buffered = (page: Page) =>
  page
    .locator('[data-part="buffered"]')
    .evaluate((bar: HTMLElement) =>
      Number(bar.style.getPropertyValue("--buffered")),
    );

let server: Server;
let src: string;
let held: ServerResponse | null = null;

test.beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, {
      "Content-Type": "audio/wav",
      "Content-Length": WAV.length,
    });
    res.write(WAV.subarray(0, HOLD_AT));
    held = res;
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  src = `http://localhost:${(server.address() as AddressInfo).port}/tone.wav`;
});

test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test("a stall reads as buffering, and playing again once data arrives", async ({
  page,
}) => {
  await page.goto(`/?src=${src}`);
  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);

  await expect(page.getByText("Buffering: true")).toBeVisible({
    timeout: 10000,
  });
  // 8 s of the 60 s tone have arrived, and no more.
  await expect.poll(() => buffered(page)).toBeCloseTo(8 / 60, 1);
  // Still in play mode: the button offers Pause through the stall.
  await expect(
    page.getByRole("button", { name: labels.pauseAudio }),
  ).toBeVisible();

  held?.end(WAV.subarray(HOLD_AT));

  await expect(page.getByText("Buffering: false")).toBeVisible({
    timeout: 10000,
  });
  await expect.poll(() => buffered(page)).toBe(1);
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(2.5);
});
