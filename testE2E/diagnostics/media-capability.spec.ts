import { test, expect, Page } from "@playwright/test";

/**
 * What the engine can actually decode, measured on a bare `<audio>` element
 * with no library in the way.
 *
 * The suite's other specs can only report that playback did not happen. They
 * cannot say why, and the difference matters: a missing decoder, a blocked
 * autoplay and an unavailable audio device all present as a clock that never
 * advances. This asks the element directly and prints the answer.
 *
 * Linux Firefox is the case this exists for. It decodes MP3 through the
 * platform's FFmpeg, so on a runner without it the container still parses —
 * `duration` and seeking work — and only playback never starts.
 */

const PROBE_MS = 2000;

type Probe = {
  canPlayType: string;
  duration: number;
  readyState: number;
  networkState: number;
  errorCode: number | null;
  playOutcome: string;
  pausedAfter: boolean;
  currentTimeAfter: number;
  readyStateAfter: number;
  buffered: number;
};

/**
 * Loads `src` into a detached element, calls `play()`, and reports the state
 * either side of it. Detached rather than the demo app's element, so a failure
 * here is the engine's and not the store's.
 */
async function probe(page: Page, src: string, probeMs: number): Promise<Probe> {
  return page.evaluate(
    async ([src, waitMs]) => {
      const audio = document.createElement("audio");
      audio.src = src as string;
      audio.preload = "auto";

      const settled = new Promise<void>((resolve) => {
        const done = () => resolve();
        audio.addEventListener("loadeddata", done, { once: true });
        audio.addEventListener("error", done, { once: true });
        setTimeout(done, waitMs as number);
      });
      audio.load();
      await settled;

      const playOutcome = await audio.play().then(
        () => "resolved",
        (error: Error) => `rejected: ${error.name}: ${error.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, waitMs as number));

      return {
        canPlayType: audio.canPlayType(
          (src as string).endsWith(".wav") ? "audio/wav" : "audio/mpeg",
        ),
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState,
        errorCode: audio.error?.code ?? null,
        playOutcome,
        pausedAfter: audio.paused,
        currentTimeAfter: audio.currentTime,
        readyStateAfter: audio.readyState,
        buffered: audio.buffered.length ? audio.buffered.end(0) : 0,
      };
    },
    [src, probeMs] as const,
  );
}

/** Printed whether the check passes or fails — a green run is evidence too. */
async function report(title: string, result: Probe) {
  const lines = Object.entries(result).map(
    ([key, value]) => `  ${key}: ${value}`,
  );
  const text = `${title}\n${lines.join("\n")}`;
  console.log(text);
  await test.info().attach(title, { body: text, contentType: "text/plain" });
  return text;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("the engine plays the suite's WAV fixture", async ({ page }) => {
  const result = await probe(page, "/test-tone.wav", PROBE_MS);
  const text = await report("WAV probe", result);

  // Hard: every other spec in the suite assumes this works, so a failure here
  // is the one worth reading first.
  expect(result.currentTimeAfter, text).toBeGreaterThan(0);
});

/**
 * Reported, not asserted. The suite deliberately no longer depends on MP3, so a
 * runner without the decoder is not a failure — but it is the thing we wanted
 * to know, and it is only knowable while something still asks.
 */
test("reports whether the engine also decodes MP3", async ({
  page,
}, testInfo) => {
  const result = await probe(page, "/The-Race.mp3", PROBE_MS);
  const text = await report("MP3 probe", result);

  const plays = result.currentTimeAfter > 0;
  testInfo.annotations.push({
    type: "mp3-decode",
    description: `${plays ? "yes" : "no"} — ${testInfo.project.name}`,
  });
  expect(text).toContain("MP3 probe");
});
