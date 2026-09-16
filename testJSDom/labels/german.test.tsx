import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { PlayButton } from "../../src/Player/PlayButton";
import { Volume } from "../../src/Volume/Volume";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { renderWithStore } from "../store/renderWithStore";
import { renderInPlayer } from "../testComponents";
import { stubElementRects, stubResizeObserver } from "../testUtils";
import type { PlayerLabels } from "../../src/Shared/playerLabels";
import "@testing-library/jest-dom";

/**
 * A proof, not a translation exercise. The mechanism — payloads, fallbacks,
 * precedence — is covered by the other three files here; a German string that
 * renders identically to the English one would assert that the code ran, not
 * that it was right. So this file covers only the three places German genuinely
 * differs, and each of them fails under a design this surface rejected.
 *
 * The expectations are written as literals. Building one by calling `Intl` the
 * same way the entry does would assert the two agree, which they would even if
 * both were wrong.
 */
const nf = new Intl.NumberFormat("de-DE");
const pf = new Intl.NumberFormat("de-DE", { style: "percent" });

const german: PlayerLabels = {
  play: {
    playing: "Audio pausieren",
    paused: "Audio abspielen",
    loading: "Audio wird geladen",
    error: "Fehler beim Laden des Audios",
  },
  volumeValue: ({ value, muted }) =>
    muted ? `Stumm, ${pf.format(value)}` : pf.format(value),
  rateValue: ({ value }) => `${nf.format(value)}x`,
};

/**
 * Four independent constructions: a passive for `loading`, an infinitive for
 * `paused`, a noun phrase for `error`. No template with a swapped verb produces
 * the set — which is what defeats a single-string `aria-label`, and why `play`
 * is an object of four strings rather than one pattern.
 */
it.each([
  ["paused", { readyState: 1, paused: true }, "Audio abspielen"],
  ["loading", { readyState: 0 }, "Audio wird geladen"],
])("PlayButton reads German in the %s state", (_, element, name) => {
  renderWithStore(<PlayButton>Play</PlayButton>, { element, labels: german });

  expect(screen.getByRole("button")).toHaveAccessibleName(name);
});

describe("numbers inside a translated sentence", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  /**
   * U+00A0 before the sign, asserted explicitly — with a plain space in the
   * expectation the test would pass against `${n} %` and prove nothing. Only
   * reachable because the entry receives `0.8` rather than a finished `"80%"`.
   */
  it("writes Stumm, 80 % with a non-breaking space", () => {
    renderInPlayer(
      <Volume>
        <Volume.Control>track</Volume.Control>
      </Volume>,
      { element: { readyState: 1, volume: 0.8, muted: true }, labels: german },
    );

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "Stumm, 80 %",
    );
  });

  /** The decimal comma, which only exists because the entry receives `1.5`. */
  it("writes the rate as 1,5x", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { element: { readyState: 1, playbackRate: 1.5 }, labels: german },
    );

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "1,5x",
    );
  });
});
