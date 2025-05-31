import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";
import * as mediaKeysModule from "../../src/KeyboardControls/handleMediaKeys";
import * as isDisabledModule from "../../src/Shared/useIsDisabled";

describe("ChangePlaybackRate", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockHandleMediaKeys = vi.fn();
  let mockIsDisabled = false;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useHandleMediaKeys
    vi.spyOn(mediaKeysModule, "useHandleMediaKeys").mockReturnValue(
      mockHandleMediaKeys,
    );
    // Mock useIsDisabled
    vi.spyOn(isDisabledModule, "useIsDisabled").mockImplementation(
      () => mockIsDisabled,
    );
  });

  const renderWithContext = (playbackRate = 1, amount = 0.25) => {
    const playerContext = {
      handlePlayerAction: mockHandlePlayerAction,
      playbackRate,
      // Other required context values
      playerState: "paused" as const,
      showCaptions: false,
      isMuted: false,
      volumeState: "high" as const,
      unmuteVolumeRef: { current: 0.5 },
      getPlayerState: vi.fn(),
      timeDisplay: "elapsed" as const,
      audioFiles: [],
      cues: [],
    };

    return render(
      <PlayerContext.Provider value={playerContext}>
        <ChangePlaybackRate amount={amount}>Change Rate</ChangePlaybackRate>
      </PlayerContext.Provider>,
    );
  };

  it("renders a button with correct text", () => {
    renderWithContext();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Change Rate");
  });

  it("sets correct aria-label for increase", () => {
    renderWithContext(1, 0.25);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "Increase playback rate by 0.25x",
    );
  });

  it("sets correct aria-label for decrease", () => {
    renderWithContext(1, -0.25);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "Decrease playback rate by 0.25x",
    );
  });

  it("calls handlePlayerAction when clicked", () => {
    // Log to confirm our test is running
    console.log("Running click test");

    // Use a fresh mock
    const handlePlayerAction = vi.fn();

    // Create minimal context with only required values
    const playerContext = {
      handlePlayerAction,
      playbackRate: 1,
      // Add minimal required context values
      playerState: "paused" as const,
      showCaptions: false,
      isMuted: false,
      volumeState: "high" as const,
      unmuteVolumeRef: { current: 0.5 },
      getPlayerState: vi.fn(),
      timeDisplay: "elapsed" as const,
      audioFiles: [],
      cues: [],
    };

    // Log before render
    console.log("About to render");

    // Render with the fresh context
    render(
      <PlayerContext.Provider value={playerContext}>
        <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>
      </PlayerContext.Provider>,
    );
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(handlePlayerAction).toHaveBeenCalled();
  });

  it("uses the useHandleMediaKeys hook for keyboard events", () => {
    renderWithContext();
    const button = screen.getByRole("button");

    const keyEvent = { key: "p" };
    fireEvent.keyDown(button, keyEvent);

    expect(mockHandleMediaKeys).toHaveBeenCalled();
  });

  it("is disabled when useIsDisabled returns true", () => {
    mockIsDisabled = true;
    renderWithContext();
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    // Clicking should not trigger the action
    fireEvent.click(button);
    expect(mockHandlePlayerAction).not.toHaveBeenCalled();
  });

  it("accepts and applies additional props", () => {
    render(
      <PlayerContext.Provider
        value={{
          handlePlayerAction: mockHandlePlayerAction,
          playbackRate: 1,
          // Other required values
          playerState: "paused" as const,
          showCaptions: false,
          isMuted: false,
          volumeState: "high" as const,
          unmuteVolumeRef: { current: 0.5 },
          getPlayerState: vi.fn(),
          timeDisplay: "elapsed" as const,
          audioFiles: [],
          cues: [],
        }}
      >
        <ChangePlaybackRate
          amount={0.25}
          data-testid="custom-button"
          className="custom-class"
        >
          Change Rate
        </ChangePlaybackRate>
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });

  it("calculates new playback rate based on current rate and amount", () => {
    // Make sure button is enabled
    vi.spyOn(isDisabledModule, "useIsDisabled").mockReturnValue(false);

    // Create a fresh mock
    const handlePlayerAction = vi.fn();

    // Create context with specific playback rate
    render(
      <PlayerContext.Provider
        value={{
          handlePlayerAction,
          playbackRate: 2,
          // Add other required context values
          playerState: "paused" as const,
          showCaptions: false,
          isMuted: false,
          volumeState: "high" as const,
          unmuteVolumeRef: { current: 0.5 },
          getPlayerState: vi.fn(),
          timeDisplay: "elapsed" as const,
          audioFiles: [],
          cues: [],
        }}
      >
        <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(handlePlayerAction).toHaveBeenCalledWith({
      type: "SET_PLAYBACK_RATE",
      playbackRate: 2.5,
    });
  });
});
