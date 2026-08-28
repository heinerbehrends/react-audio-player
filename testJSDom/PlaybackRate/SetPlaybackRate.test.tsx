import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "../../src/PlaybackRate/SetPlaybackRate";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";

const renderRate = (
  ui: React.ReactElement,
  element: Partial<MediaFields> = {},
) => renderWithStore(ui, { element });

describe("SetPlaybackRate", () => {
  it("renders a button with correct text", () => {
    renderRate(<SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("1.5x");
  });

  it("sets correct aria-label", () => {
    renderRate(<SetPlaybackRate rate={2}>2x</SetPlaybackRate>);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Set playback rate to 2x",
    );
  });

  it("writes the rate to the element when clicked", () => {
    const { element } = renderRate(
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(1.5);
  });

  it("marks itself current once the element reports that rate", () => {
    const { element, emit } = renderRate(
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-current");

    element.playbackRate = 1.5;
    emit("ratechange");

    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "true");
  });

  /**
   * Against the element, not a mock of the hook: mocking `useHandleMediaKeys`
   * passes even when the real handler does nothing (T9).
   */
  it("handles media keys, writing the element", () => {
    const { element } = renderRate(
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    );
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });
    expect(element.play).toHaveBeenCalled();

    // `>` steps the rate by 0.05; it does not jump to this button's own 1.5.
    fireEvent.keyDown(button, { key: ">" });
    expect(element.playbackRate).toBeCloseTo(1.05, 10);
  });

  /**
   * `playbackRate` is settable before metadata, so loading is not a reason to
   * suppress this button. It was only ever disabled as collateral damage from a
   * gate meant for the timeline.
   */
  it("stays enabled and writable while the player is loading", () => {
    const { element } = renderRate(
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
      { readyState: 0, duration: 0 },
    );
    const button = screen.getByRole("button");

    expect(button).not.toHaveAttribute("aria-disabled");

    fireEvent.click(button);
    expect(element.playbackRate).toBe(1.5);
  });

  it("is aria-disabled on an error, and does not activate", () => {
    const { element } = renderRate(
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
      { error: {} as MediaError },
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not native `disabled`: the tab stop has to survive (A7).
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(element.playbackRate).toBe(1);
  });

  it("accepts and applies additional props", () => {
    renderRate(
      <SetPlaybackRate
        rate={1.5}
        data-testid="custom-button"
        className="custom-class"
      >
        1.5x
      </SetPlaybackRate>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });
});

describe("CurrentIndicator", () => {
  it("renders children when rate matches current playback rate", () => {
    renderRate(
      <CurrentIndicator rate={1}>
        <span data-testid="indicator">Current</span>
      </CurrentIndicator>,
      { playbackRate: 1 },
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toBeVisible();
    expect(indicator).toHaveTextContent("Current");
  });

  it("hides children when rate doesn't match current playback rate", () => {
    renderRate(
      <CurrentIndicator rate={2}>
        <span data-testid="indicator">Current</span>
      </CurrentIndicator>,
      { playbackRate: 1 },
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toBeVisible();
    expect(indicator.parentElement).toHaveStyle({ visibility: "hidden" });
  });

  it("handles close but not exact rate values", () => {
    renderRate(
      <CurrentIndicator rate={1}>
        <span data-testid="indicator">Current</span>
      </CurrentIndicator>,
      { playbackRate: 1.001 },
    );

    expect(screen.getByTestId("indicator")).toBeVisible();
  });
});

describe("RateDisplay", () => {
  it("displays the current playback rate with 'x' suffix", () => {
    renderRate(<RateDisplay />, { playbackRate: 1.5 });

    expect(screen.getByLabelText("Current playback rate")).toHaveTextContent(
      "1.5x",
    );
  });

  it("rounds the playback rate to 2 decimal places", () => {
    renderRate(<RateDisplay />, { playbackRate: 1.755 });

    expect(screen.getByLabelText("Current playback rate")).toHaveTextContent(
      "1.76x",
    );
  });

  it("follows a ratechange", () => {
    const { element, emit } = renderRate(<RateDisplay />, { playbackRate: 1 });

    element.playbackRate = 2;
    emit("ratechange");

    expect(screen.getByLabelText("Current playback rate")).toHaveTextContent(
      "2x",
    );
  });

  it("accepts and applies additional props", () => {
    renderRate(
      <RateDisplay data-testid="rate-display" className="custom-display" />,
    );
    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveAttribute("data-testid", "rate-display");
    expect(display).toHaveClass("custom-display");
  });
});
