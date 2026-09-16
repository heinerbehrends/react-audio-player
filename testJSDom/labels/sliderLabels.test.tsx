import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { Timeline } from "../../src/Timeline/Timeline";
import { Volume } from "../../src/Volume/Volume";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { renderInPlayer } from "../testComponents";
import { stubElementRects, stubResizeObserver } from "../testUtils";
import type { PlayerLabels } from "../../src/Shared/playerLabels";
import type { SliderAriaState } from "../../src/Slider/sliderModes";
import "@testing-library/jest-dom";

/** Every entry writes its payload out, so a test can read what it received. */
const spell = ({ value, maxValue, muted }: SliderAriaState) =>
  `v=${value} max=${maxValue} muted=${muted}`;

const labels: PlayerLabels = {
  timelineSlider: "Zeitleiste",
  volumeSlider: "Lautstärke",
  rateSlider: "Geschwindigkeit",
  timelineValue: spell,
  volumeValue: spell,
  rateValue: spell,
};

const sliders = {
  timeline: <Timeline>{<Timeline.Control>track</Timeline.Control>}</Timeline>,
  volume: <Volume>{<Volume.Control>track</Volume.Control>}</Volume>,
  rate: (
    <PlaybackRateSlider>
      <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
    </PlaybackRateSlider>
  ),
};

const element = { readyState: 1, duration: 120, currentTime: 30.7 };

describe("slider labels", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it.each([
    ["timeline", "Zeitleiste"],
    ["volume", "Lautstärke"],
    ["rate", "Geschwindigkeit"],
  ] as const)("names the %s slider from its entry", (mode, name) => {
    renderInPlayer(sliders[mode], { element, labels });

    expect(screen.getByRole("slider")).toHaveAttribute("aria-label", name);
  });

  it.each([
    ["timeline", "Timeline slider"],
    ["volume", "Volume slider"],
    ["rate", "Playback rate slider"],
  ] as const)("falls back to English for the %s slider", (mode, name) => {
    renderInPlayer(sliders[mode], { element });

    expect(screen.getByRole("slider")).toHaveAttribute("aria-label", name);
  });

  it.each([
    ["timeline", "Position 0:30 of 2:00"],
    ["volume", "100%"],
    ["rate", "1x"],
  ] as const)("falls back to English valuetext for %s", (mode, text) => {
    renderInPlayer(sliders[mode], { element });

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", text);
  });

  it("hands the timeline entry the floored second and the duration", () => {
    // 30.7 s floors to 30: `aria-valuenow` cannot churn above 1 Hz (A13).
    renderInPlayer(sliders.timeline, { element, labels });

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "v=30 max=120 muted=false",
    );
  });

  it.each([
    ["while muted", true],
    ["while audible", false],
  ])("hands the volume entry muted %s", (_, muted) => {
    renderInPlayer(sliders.volume, {
      element: { ...element, volume: 0.8, muted },
      labels,
    });

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      `v=0.8 max=1 muted=${muted}`,
    );
  });

  it("hands the rate entry the rate, ignoring maxValue and muted", () => {
    renderInPlayer(sliders.rate, {
      element: { ...element, playbackRate: 1.5 },
      labels,
    });

    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "v=1.5 max=4 muted=false",
    );
  });

  /**
   * The drift guard. `aria-valuetext` and `aria-valuenow` have to describe one
   * number, so the entry receives the quantized value rather than the raw float
   * behind it. Each entry echoes its `value` back, and the assertion compares
   * the two attributes — not two expectations that could be updated to agree on
   * the same wrong number.
   */
  it.each(["timeline", "volume", "rate"] as const)(
    "gives the %s entry the number in aria-valuenow",
    (mode) => {
      const echo = ({ value }: SliderAriaState) => String(value);
      renderInPlayer(sliders[mode], {
        element: { ...element, volume: 0.834, playbackRate: 1.276 },
        labels: { timelineValue: echo, volumeValue: echo, rateValue: echo },
      });

      const slider = screen.getByRole("slider");
      expect(slider.getAttribute("aria-valuetext")).toBe(
        slider.getAttribute("aria-valuenow"),
      );
    },
  );

  it("loses to a per-instance aria-valuetext on .Control", () => {
    // `aria` is spread before `props`, so the call site still wins (S5, A14).
    renderInPlayer(
      <Volume>
        <Volume.Control aria-valuetext="ganz laut" aria-label="Regler">
          track
        </Volume.Control>
      </Volume>,
      { element, labels },
    );

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuetext", "ganz laut");
    expect(slider).toHaveAttribute("aria-label", "Regler");
  });
});
