import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "../../src/PlaybackRate/SetPlaybackRate";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";
import * as mediaKeysModule from "../../src/KeyboardControls/handleMediaKeys";
import * as isDisabledModule from "../../src/Shared/useIsDisabled";

const defaultContext = {
  handlePlayerAction: vi.fn(),
  playbackRate: 1,
  playerState: "paused" as const,
  showCaptions: false,
  isMuted: false,
  volumeState: "high" as const,
  unmuteVolumeRef: { current: 0.7 },
  getPlayerState: vi.fn(),
  timeDisplay: "elapsed" as const,
  audioFiles: [],
  cues: [],
};

describe("SetPlaybackRate", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockHandleKeyDown = vi.fn();
  let mockIsDisabled = false;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mediaKeysModule, "useHandleMediaKeys").mockReturnValue(
      mockHandleKeyDown,
    );
    vi.spyOn(isDisabledModule, "useIsDisabled").mockImplementation(
      () => mockIsDisabled,
    );
  });

  const renderWithContext = (playbackRate = 1, rate = 1.5) => {
    const playerContext = {
      ...defaultContext,
      handlePlayerAction: mockHandlePlayerAction,
      playbackRate,
    };

    return render(
      <PlayerContext.Provider value={playerContext}>
        <SetPlaybackRate rate={rate}>{rate}x</SetPlaybackRate>
      </PlayerContext.Provider>,
    );
  };

  it("renders a button with correct text", () => {
    renderWithContext();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("1.5x");
  });

  it("sets correct aria-label", () => {
    renderWithContext(1, 2);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Set playback rate to 2x");
  });

  it("calls handlePlayerAction with correct values when clicked", () => {
    renderWithContext();
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(mockHandlePlayerAction).toHaveBeenCalledWith({
      type: "SET_PLAYBACK_RATE",
      playbackRate: 1.5,
    });
  });

  it("uses handleMediaKeys for keyboard events", () => {
    renderWithContext();
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });

    expect(mockHandleKeyDown).toHaveBeenCalled();
  });

  it("is disabled when useIsDisabled returns true", () => {
    mockIsDisabled = true;
    renderWithContext();
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockHandlePlayerAction).not.toHaveBeenCalled();
  });

  it("accepts and applies additional props", () => {
    render(
      <PlayerContext.Provider
        value={{
          ...defaultContext,
          handlePlayerAction: mockHandlePlayerAction,
          playbackRate: 1,
        }}
      >
        <SetPlaybackRate
          rate={1.5}
          data-testid="custom-button"
          className="custom-class"
        >
          1.5x
        </SetPlaybackRate>
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });
});

describe("CurrentIndicator", () => {
  const testContext = {
    ...defaultContext,
  };

  it("renders children when rate matches current playback rate", () => {
    render(
      <PlayerContext.Provider value={testContext}>
        <CurrentIndicator rate={1}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      </PlayerContext.Provider>,
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toBeVisible();
    expect(indicator).toHaveTextContent("Current");
  });

  it("hides children when rate doesn't match current playback rate", () => {
    render(
      <PlayerContext.Provider value={testContext}>
        <CurrentIndicator rate={2}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      </PlayerContext.Provider>,
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toBeVisible();
    expect(indicator.parentElement).toHaveStyle({ visibility: "hidden" });
  });

  it("handles close but not exact rate values", () => {
    render(
      <PlayerContext.Provider
        value={{
          ...testContext,
          playbackRate: 1.001, // Very close to 1
        }}
      >
        <CurrentIndicator rate={1}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      </PlayerContext.Provider>,
    );

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeVisible();
  });
});

describe("RateDisplay", () => {
  it("displays the current playback rate with 'x' suffix", () => {
    render(
      <PlayerContext.Provider
        value={{
          ...defaultContext,
          playbackRate: 1.5,
        }}
      >
        <RateDisplay />
      </PlayerContext.Provider>,
    );

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.5x");
  });

  it("rounds the playback rate to 2 decimal places", () => {
    render(
      <PlayerContext.Provider
        value={{
          ...defaultContext,
          playbackRate: 1.75555,
        }}
      >
        <RateDisplay />
      </PlayerContext.Provider>,
    );

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.76x");
  });

  it("accepts and applies additional props", () => {
    render(
      <PlayerContext.Provider
        value={{
          ...defaultContext,
          playbackRate: 1,
        }}
      >
        <RateDisplay data-testid="rate-display" className="custom-display" />
      </PlayerContext.Provider>,
    );

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveAttribute("data-testid", "rate-display");
    expect(display).toHaveClass("custom-display");
  });
});
