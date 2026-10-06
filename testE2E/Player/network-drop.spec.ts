import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { test, expect } from "@playwright/test";
import { labels, waitForPlaying } from "../test-utils";

/**
 * A connection that drops part-way through stops the fetch for good, and
 * the player read that as paused, with no error. Chromium pauses and fires
 * `error` once its reconnects fail; Firefox fires `error` at the drop and
 * plays out the buffer first.
 *
 * Served from a local server rather than routed: `route.fulfill` sends a
 * whole body, and the failure is a body cut short.
 */
const WAV = readFileSync("public/test-tone.wav");
// The header and 8 s of the tone: 22.05 kHz, mono, 16-bit. Less, and
// Chromium has not read the metadata when the connection goes.
const CUT = 44 + 8 * 44100;

let server: Server;
let src: string;
// "down": the first request is cut short, and every reconnect gets a 503,
// which Chromium gives up on in seconds where a reset takes it ~25.
let station: "down" | "up" = "down";
let requests = 0;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    requests += 1;
    if (station === "up") {
      res.writeHead(200, { "Content-Type": "audio/wav" });
      res.end(WAV);
      return;
    }
    if (requests > 1) {
      res.writeHead(503);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "audio/wav",
      "Content-Length": WAV.length,
    });
    res.write(WAV.subarray(0, CUT));
    setTimeout(() => req.socket.destroy(), 300);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  src = `http://localhost:${(server.address() as AddressInfo).port}/tone.wav`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const MEDIA_EVENTS = [
  "loadstart",
  "suspend",
  "playing",
  "waiting",
  "stalled",
  "pause",
  "ended",
  "error",
  "emptied",
  "abort",
];

test.beforeEach(async ({ page }) => {
  station = "down";
  requests = 0;
  // Every media event with the element's state, for a failure that does not
  // reproduce on demand.
  await page.addInitScript((events) => {
    const log: string[] = [];
    (window as unknown as { mediaLog: string[] }).mediaLog = log;
    const start = performance.now();
    for (const type of events) {
      document.addEventListener(
        type,
        ({ target }) => {
          const a = target as HTMLAudioElement;
          log.push(
            `${((performance.now() - start) / 1000).toFixed(2)}s ${type} paused=${a.paused} ended=${a.ended} readyState=${a.readyState} networkState=${a.networkState} error=${a.error?.code ?? "-"} t=${a.currentTime.toFixed(2)}`,
          );
        },
        true,
      );
    }
  }, MEDIA_EVENTS);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const log = await page
    .evaluate(() => (window as unknown as { mediaLog: string[] }).mediaLog)
    .catch(() => ["(page gone)"]);
  const text = [`requests: ${requests}`, ...log].join("\n");
  await testInfo.attach("media-events", {
    body: text,
    contentType: "text/plain",
  });
  console.log(`\n--- media events (${testInfo.project.name}) ---\n${text}`);
});

test("a connection that drops mid-play shows the error", async ({ page }) => {
  await page.goto(`/?src=${src}`);
  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);

  await expect(page.getByRole("alert")).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: labels.playError }),
  ).toHaveAttribute("aria-disabled", "true");
});

// The retry recipe: `load()` resets the element, and the store follows it out
// of the error with no help.
test("a reload after the drop plays again", async ({ page }) => {
  await page.goto(`/?src=${src}`);
  await page.getByRole("button", { name: labels.playAudio }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 20000 });

  station = "up";
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => {
    audio.load();
  });

  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: labels.playAudio }).click();
  await waitForPlaying(page);
});
