import { createServer, type Server, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { test, expect } from "@playwright/test";
import { labels, waitForPlaying } from "../test-utils";

/**
 * `useIsBuffering()` is derived from `readyState`, so only a real stall shows
 * whether each engine drops it below `HAVE_FUTURE_DATA` and back. The server
 * sends 2 s of the tone and holds the connection open, then sends the rest.
 */
const WAV = readFileSync("public/test-tone.wav");
// The header and 2 s of 44.1 kHz 16-bit stereo.
const HOLD_AT = 44 + 2 * 176400;

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
  // Still in play mode: the button offers Pause through the stall.
  await expect(
    page.getByRole("button", { name: labels.pauseAudio }),
  ).toBeVisible();

  held?.end(WAV.subarray(HOLD_AT));

  await expect(page.getByText("Buffering: false")).toBeVisible({
    timeout: 10000,
  });
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(2.5);
});
