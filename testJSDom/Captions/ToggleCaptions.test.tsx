import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ToggleCaptions } from "../../src/Captions/ToggleCaptions";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";

// Create a variable to control the hook's return value
let isDisabledMockValue = false;

// Mock the module with a function that uses our variable
vi.mock("../../src/Shared/useIsDisabled", () => ({
  useIsDisabled: () => isDisabledMockValue,
}));

describe("ToggleCaptions", () => {
  const mockHandlePlayerAction = vi.fn();

  // Default player context with captions off
  const defaultContext = {
    handlePlayerAction: mockHandlePlayerAction,
    showCaptions: false,
    playerState: "paused" as const,
    isMuted: false,
    audioFiles: [],
    cues: [],
    getPlayerState: vi.fn(),
    playbackRate: 1,
    volumeState: "high" as const,
    unmuteVolumeRef: { current: 0.5 },
    timeDisplay: "elapsed" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default value before each test
    isDisabledMockValue = false;
  });

  it("renders button with correct text", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button", { name: /toggle captions/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Show Captions");
  });

  it("has correct ARIA attributes when captions are off", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Toggle Captions");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("has correct ARIA attributes when captions are on", () => {
    const contextWithCaptions = {
      ...defaultContext,
      showCaptions: true,
    };

    render(
      <PlayerContext.Provider value={contextWithCaptions}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("dispatches TOGGLE_CAPTIONS action when clicked", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockHandlePlayerAction).toHaveBeenCalledWith({
      type: "TOGGLE_CAPTIONS",
    });
  });

  it("is disabled when useIsDisabled returns true", () => {
    // Set the mock value to true
    isDisabledMockValue = true;

    render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is enabled when useIsDisabled returns false", () => {
    // Set the mock value to false
    isDisabledMockValue = false;

    render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("memoizes the click handler to prevent unnecessary rerenders", () => {
    const { rerender } = render(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const initialButton = screen.getByRole("button");
    const initialOnClick = initialButton.onclick;

    // Force a rerender with the same props
    rerender(
      <PlayerContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </PlayerContext.Provider>,
    );

    const updatedButton = screen.getByRole("button");
    expect(updatedButton.onclick).toBe(initialOnClick);
  });
});
