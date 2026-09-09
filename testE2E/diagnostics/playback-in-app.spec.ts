import { test, expect, Page } from "@playwright/test";
import { waitForAudio } from "../test-utils";

/**
 * The gap between "the engine can play this file" and "the player reaches
 * `playing`".
 *
 * `media-capability.spec.ts` proves the first on a detached element. Seven specs
 * failed on Firefox in CI while it passed, all of them waiting for the play
 * button to rename itself to "Pause audio" — so the engine was never the
 * problem, and none of those specs can say what the element did instead.
 *
 * This records the media events and the button's name across a play attempt, so
 * a failure arrives with the sequence that produced it rather than a timeout.
 */

const WATCHED_EVENTS = [
  "loadstart",
  "loadedmetadata",
  "loadeddata",
  "canplay",
  "canplaythrough",
  "play",
  "playing",
  "waiting",
  "stalled",
  "suspend",
  "timeupdate",
  "pause",
  "error",
  "emptied",
] as const;

/** The four names `PlayButton` can carry, and the only ones worth matching. */
const PLAY_BUTTON_LABELS = [
  "Play audio",
  "Pause audio",
  "Loading audio",
  "Error loading audio",
];

type Trace = {
  preload: string;
  currentSrc: string;
  before: Record<string, unknown>;
  events: string[];
  samples: string[];
  after: Record<string, unknown>;
};

/**
 * Clicks play from inside the page and watches for `ms`.
 *
 * The click is dispatched here rather than through Playwright so the whole run
 * sits in one `evaluate`: the event log and the samples then share a clock, and
 * nothing is lost to round-trip latency.
 */
async function tracePlayAttempt(
  page: Page,
  ms: number,
  labels: string[],
  watched: readonly string[],
): Promise<Trace> {
  return page.evaluate(
    async ([ms, labels, watched]) => {
      const audio = document.querySelector("audio")!;
      const button = () =>
        (labels as string[])
          .map((label) =>
            document.querySelector<HTMLButtonElement>(
              `button[aria-label="${label}"]`,
            ),
          )
          .find(Boolean) ?? null;

      const snapshot = (audio: HTMLAudioElement) => ({
        paused: audio.paused,
        readyState: audio.readyState,
        networkState: audio.networkState,
        currentTime: Number(audio.currentTime.toFixed(3)),
        duration: audio.duration,
        buffered: audio.buffered.length ? audio.buffered.end(0) : 0,
        errorCode: audio.error?.code ?? null,
        buttonLabel: button()?.getAttribute("aria-label") ?? "no button found",
      });

      const started = performance.now();
      const at = () => Math.round(performance.now() - started);
      const events: string[] = [];
      for (const type of watched as string[]) {
        audio.addEventListener(type, () => {
          // `timeupdate` fires ~4x/second and would bury the rest.
          if (
            type === "timeupdate" &&
            events.some((e) => e.includes("timeupdate"))
          ) {
            return;
          }
          events.push(`${at()}ms ${type} (readyState ${audio.readyState})`);
        });
      }

      const before = snapshot(audio);
      button()?.click();

      const samples: string[] = [];
      const deadline = performance.now() + (ms as number);
      while (performance.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const now = snapshot(audio);
        samples.push(
          `${at()}ms paused=${now.paused} readyState=${now.readyState} currentTime=${now.currentTime} label=${now.buttonLabel}`,
        );
      }

      return {
        preload: audio.preload,
        currentSrc: audio.currentSrc,
        before,
        events,
        samples,
        after: snapshot(audio),
      };
    },
    [ms, labels, watched] as const,
  );
}

test("the player reaches playing after a click on the play button", async ({
  page,
}) => {
  await page.goto("/");
  await waitForAudio(page);

  const trace = await tracePlayAttempt(
    page,
    5000,
    PLAY_BUTTON_LABELS,
    WATCHED_EVENTS,
  );

  const text = [
    `preload: ${trace.preload}`,
    `currentSrc: ${trace.currentSrc}`,
    `before: ${JSON.stringify(trace.before)}`,
    `after: ${JSON.stringify(trace.after)}`,
    "events:",
    ...trace.events.map((line) => `  ${line}`),
    "samples:",
    ...trace.samples.map((line) => `  ${line}`),
  ].join("\n");

  console.log(text);
  await test
    .info()
    .attach("play attempt", { body: text, contentType: "text/plain" });

  // The button's name is the assertion the seven failing specs were making, one
  // way or another. Failing here prints the sequence; failing there did not.
  expect(trace.after.buttonLabel, text).toBe("Pause audio");
  expect(trace.after.currentTime, text).not.toBe(0);
});
