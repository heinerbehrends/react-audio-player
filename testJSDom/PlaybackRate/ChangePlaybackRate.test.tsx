import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";

describe("ChangePlaybackRate", () => {
  const renderChange = (
    ui: React.ReactElement,
    element: Partial<MediaFields> = {},
  ) => renderWithStore(ui, { element });

  it("renders a button with correct text", () => {
    renderChange(
      <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Change Rate");
  });

  it("sets correct aria-label for increase", () => {
    renderChange(
      <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Increase playback rate by 0.25x",
    );
  });

  it("sets correct aria-label for decrease", () => {
    renderChange(
      <ChangePlaybackRate amount={-0.25}>Change Rate</ChangePlaybackRate>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Decrease playback rate by 0.25x",
    );
  });

  it("writes the element on click", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(1.25);
  });

  /**
   * Against the element, not a mock of the hook: mocking `useHandleMediaKeys`
   * passes even when the real handler does nothing (T9).
   */
  it("handles media keys, writing the element", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });
    expect(element.play).toHaveBeenCalled();

    // `>` is the global rate key, a different path from this button's own
    // `amount`: it steps 0.05, not 0.25.
    fireEvent.keyDown(button, { key: ">" });
    expect(element.playbackRate).toBeCloseTo(1.05, 10);
  });

  it("is aria-disabled while the player is loading, and does not activate", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
      { readyState: 0 },
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not native `disabled`: the tab stop has to survive (A7).
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(element.playbackRate).toBe(1);
  });

  it("accepts and applies additional props", () => {
    renderChange(
      <ChangePlaybackRate
        amount={0.25}
        data-testid="custom-button"
        className="custom-class"
      >
        Test
      </ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });

  it("adds the amount to the current rate", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 2 },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(2.5);
  });

  /**
   * The tearing hazard: reading `playbackRate` during render leaves the next
   * click computing from a stale value. Subscribing to `ratechange` is what
   * keeps it fresh.
   */
  it("adds to the rate the element reports after a ratechange", () => {
    const { element, emit } = renderChange(
      <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 1 },
    );

    element.playbackRate = 2;
    emit("ratechange");

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(2.5);
  });
});
