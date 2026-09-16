import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import { PlaybackRate } from "../../src/PlaybackRate/PlaybackRate";
import {
  SetPlaybackRate,
  RateDisplay,
} from "../../src/PlaybackRate/SetPlaybackRate";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { createTestStore } from "../store/createTestStore";
import { renderWithStore } from "../store/renderWithStore";
import { renderInPlayer } from "../testComponents";
import type { PlayerLabels } from "../../src/Shared/playerLabels";
import type { TimeDisplayState } from "../../src/store/createPlayerStore";
import "@testing-library/jest-dom";

/** The readouts carry no accessible name of their own — `data-part` is the hook. */
const part = (name: string) =>
  document.querySelector(`[data-part="${name}"]`) as HTMLElement | null;

function withTimeDisplay(
  timeDisplay: TimeDisplayState,
  element: Parameters<typeof createTestStore>[0] = {},
) {
  const harness = createTestStore({ readyState: 1, duration: 120, ...element });
  harness.store.timeDisplay.set(timeDisplay);
  return harness;
}

/**
 * A marker rather than a translation: `1:30` is `1:30` in de-DE, so German
 * proves nothing here. What needs pinning is the routing — that each readout
 * asks for its own `part` and hands over the right magnitude.
 */
const marker: NonNullable<PlayerLabels["time"]> = ({ seconds, part: which }) =>
  `${which}@${seconds}`;

describe("labels.time", () => {
  it("routes Time.Elapsed through the entry", () => {
    renderWithStore(<Time.Elapsed />, {
      testStore: withTimeDisplay("elapsed", { currentTime: 30 }),
      labels: { time: marker },
    });

    expect(part("elapsed")).toHaveTextContent("elapsed@30");
  });

  it("routes Time.Remaining through the entry, with a magnitude", () => {
    // 120 − 30, unsigned: the entry writes its own "-", so `formatTime` never
    // has to grow negative handling.
    renderWithStore(<Time.Remaining />, {
      testStore: withTimeDisplay("remaining", { currentTime: 30 }),
      labels: { time: marker },
    });

    expect(part("remaining")).toHaveTextContent("remaining@90");
  });

  it("routes Time.Duration through the entry", () => {
    renderWithStore(<Time.Duration />, {
      testStore: withTimeDisplay("elapsed"),
      labels: { time: marker },
    });

    expect(part("duration")).toHaveTextContent("duration@120");
  });

  it.each([
    ["while loading", { readyState: 0, currentTime: 0 }],
    ["at the end", { readyState: 1, currentTime: 120 }],
  ])("calls the entry with seconds: 0 %s", (_, element) => {
    // Not a hardcoded "0:00" past the entry, and not a negative: both are
    // library rules about *which* number, and the consumer still formats it.
    renderWithStore(<Time.Remaining />, {
      testStore: withTimeDisplay("remaining", element),
      labels: { time: marker },
    });

    expect(part("remaining")).toHaveTextContent("remaining@0");
  });

  /**
   * The drift guard for the clocks. `duration - currentSecond` is fractional on
   * most real tracks and `formatTime` rounds, so an entry handed the float
   * rendered a second below the fallback wherever it floored — and the last
   * half-second of a track reached the entry as `0.6`, where the documented
   * `remaining` example writes `-0:00`, the exact glitch the component avoids.
   *
   * Fractional fixtures on purpose: with integer ones this passes against the
   * bug.
   */
  it.each([
    ["remaining", <Time.Remaining key="r" />, "remaining@158"],
    ["duration", <Time.Duration key="d" />, "duration@188"],
  ])("hands %s whole seconds, not the float behind it", (name, ui, text) => {
    renderWithStore(ui, {
      testStore: withTimeDisplay("remaining", {
        duration: 187.6,
        currentTime: 30,
      }),
      labels: { time: marker },
    });

    expect(part(name)).toHaveTextContent(text);
  });

  it("never hands the entry a value that would render -0:00", () => {
    // 0.6 s left — from a fractional *duration*, since `currentSecond` is
    // floored and cannot contribute one. Rounds to 1, so the entry says
    // "-0:01" like the fallback rather than flooring to a signed zero.
    renderWithStore(<Time.Remaining />, {
      testStore: withTimeDisplay("remaining", {
        duration: 119.6,
        currentTime: 119,
      }),
      labels: { time: marker },
    });

    expect(part("remaining")).toHaveTextContent("remaining@1");
  });

  it("falls back to today's English clocks with no entry", () => {
    renderWithStore(
      <>
        <Time.Remaining />
        <Time.Duration />
      </>,
      { testStore: withTimeDisplay("remaining", { currentTime: 30 }) },
    );

    expect(part("remaining")).toHaveTextContent("-1:30");
    expect(part("duration")).toHaveTextContent("2:00");
  });
});

describe("labels.rateDisplay", () => {
  it("supplies the text, with the rounded rate", () => {
    const nf = new Intl.NumberFormat("de-DE");
    renderWithStore(<RateDisplay />, {
      element: { readyState: 1, playbackRate: 1.755 },
      labels: { rateDisplay: ({ rate }) => `${nf.format(rate)}x` },
    });

    expect(part("rate-display")).toHaveTextContent("1,76x");
  });

  it("falls back to English with no entry", () => {
    renderWithStore(<RateDisplay />, {
      element: { readyState: 1, playbackRate: 1.5 },
    });

    expect(part("rate-display")).toHaveTextContent("1.5x");
  });
});

describe("the remaining tier-3 names", () => {
  it("names the <audio> element from labels.player", () => {
    renderInPlayer(<AudioElement />, { labels: { player: "Audioplayer" } });

    expect(screen.getByLabelText("Audioplayer")).toBeInTheDocument();
  });

  it("lets audioProps still beat labels.player", () => {
    // The spread order is the precedence: per-instance wins.
    renderInPlayer(<AudioElement aria-label="Hörbuch" />, {
      labels: { player: "Audioplayer" },
    });

    expect(screen.getByLabelText("Hörbuch")).toBeInTheDocument();
    expect(screen.queryByLabelText("Audioplayer")).not.toBeInTheDocument();
  });

  it("names the rate group from labels.rateGroup", () => {
    renderWithStore(
      <PlaybackRate>
        <span>controls</span>
      </PlaybackRate>,
      { labels: { rateGroup: "Wiedergabegeschwindigkeit" } },
    );

    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Wiedergabegeschwindigkeit",
    );
  });

  it("names PlaybackRate.Set from labels.rateSet", () => {
    renderWithStore(<SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>, {
      element: { readyState: 1 },
      labels: { rateSet: ({ rate }) => `Tempo ${rate}x einstellen` },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Tempo 1.5x einstellen",
    );
  });

  it.each([
    [0.25, "Tempo um 0.25x erhöhen"],
    [-0.25, "Tempo um 0.25x verringern"],
  ])(
    "names PlaybackRate.Change from labels.rateChange (%s)",
    (amount, name) => {
      renderWithStore(
        <ChangePlaybackRate amount={amount}>±</ChangePlaybackRate>,
        {
          element: { readyState: 1 },
          labels: {
            rateChange: ({ amount }) =>
              `Tempo um ${Math.abs(amount)}x ${amount > 0 ? "erhöhen" : "verringern"}`,
          },
        },
      );

      expect(screen.getByRole("button")).toHaveAccessibleName(name);
    },
  );
});
