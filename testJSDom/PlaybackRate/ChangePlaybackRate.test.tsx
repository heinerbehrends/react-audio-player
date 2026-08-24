import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import * as mediaKeysModule from "../../src/KeyboardControls/handleMediaKeys";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";

describe("ChangePlaybackRate", () => {
  const mockHandleMediaKeys = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(mediaKeysModule, "useHandleMediaKeys").mockReturnValue(
      mockHandleMediaKeys,
    );
  });

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

  it("uses the useHandleMediaKeys hook for keyboard events", () => {
    renderChange(<ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>);

    fireEvent.keyDown(screen.getByRole("button"), { key: "p" });

    expect(mockHandleMediaKeys).toHaveBeenCalled();
  });

  it("is disabled while the player is loading", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
      { readyState: 0 },
    );
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

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
   * The tearing hazard this migration removes. `useAudioElement` read
   * `playbackRate` during render; a `ratechange` the component is subscribed to
   * is what makes the next click compute from a fresh value.
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
