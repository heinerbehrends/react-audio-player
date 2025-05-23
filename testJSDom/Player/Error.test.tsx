import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Error } from "../../src/Player/Error";
import { PlayerContext, PlayerState } from "../../src/Player/PlayerContext";

describe("Error", () => {
  const mockPlayerContext = {
    playerState: "playing" as const,
    handlePlayerAction: vi.fn(),
    getPlayerState: vi.fn(),
    playbackRate: 1,
    volumeState: "muted" as const,
    showCaptions: false,
    isMuted: false,
    unmuteVolumeRef: { current: 0 },
    timeDisplay: "elapsed" as const,
    duration: 0,
    currentTime: 0,
    cues: [],
    audioFiles: [],
  };

  const renderWithContext = (
    playerState: PlayerState,
    children: React.ReactNode
  ) => {
    return render(
      <PlayerContext.Provider value={{ ...mockPlayerContext, playerState }}>
        <Error>{children}</Error>
      </PlayerContext.Provider>
    );
  };

  it("renders error message when player state is 'error'", () => {
    renderWithContext("error", "Custom error message");

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass("audio-player-error");
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("includes screen reader text for accessibility", () => {
    renderWithContext("error", "Custom error message");

    const srOnly = screen.getByText("There was an error loading the audio");
    expect(srOnly).toHaveClass("sr-only");
  });

  it("returns null when player state is not 'error'", () => {
    const { container } = renderWithContext("playing", "Custom error message");
    expect(container).toBeEmptyDOMElement();
  });

  it("maintains proper ARIA attributes", () => {
    renderWithContext("error", "Custom error message");

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toHaveAttribute("aria-live", "assertive");

    const visibleContent = screen.getByText("Custom error message");
    expect(visibleContent).toHaveAttribute("aria-hidden", "true");
  });

  it("handles different error messages", () => {
    const errorMessage = "Network error occurred";
    renderWithContext("error", errorMessage);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
