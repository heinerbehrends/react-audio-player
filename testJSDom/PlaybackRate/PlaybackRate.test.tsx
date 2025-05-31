import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaybackRate } from "../../src/PlaybackRate/PlaybackRate";
import { PlayerContext } from "../../src/Player/PlayerContext";

// Setup player context for testing
const mockPlayerContext = {
  handlePlayerAction: vi.fn(),
  playbackRate: 1.5,
  playerState: "playing" as const,
  showCaptions: false,
  isMuted: false,
  volumeState: "high" as const,
  unmuteVolumeRef: { current: 0.5 },
  getPlayerState: () => ({
    playerState: "playing" as const,
    duration: 100,
    currentTime: 50,
    volume: 0.5,
    playbackRate: 1.0,
    volumeState: "high" as const,
    unmuteVolumeRef: { current: 0.5 },
  }),
  timeDisplay: "elapsed" as const,
  audioFiles: [],
  cues: [],
};

describe("PlaybackRate", () => {
  it("should export all subcomponents", () => {
    expect(PlaybackRate.Set).toBeDefined();
    expect(PlaybackRate.Change).toBeDefined();
    expect(PlaybackRate.Current).toBeDefined();
    expect(PlaybackRate.Display).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render PlaybackRate.Set with expected attributes", () => {
      render(
        <PlayerContext.Provider value={mockPlayerContext}>
          <PlaybackRate.Set rate={1.5} data-testid="set-button">
            1.5x
          </PlaybackRate.Set>
        </PlayerContext.Provider>,
      );

      const button = screen.getByTestId("set-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Set playback rate to 1.5x");
      expect(button).toHaveTextContent("1.5x");
    });

    it("should render PlaybackRate.Change with expected attributes", () => {
      render(
        <PlayerContext.Provider value={mockPlayerContext}>
          <PlaybackRate.Change amount={0.25} data-testid="change-button">
            Faster
          </PlaybackRate.Change>
        </PlayerContext.Provider>,
      );

      const button = screen.getByTestId("change-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Faster");
    });

    it("should render PlaybackRate.Current with current rate", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, playbackRate: 1.5 }}
        >
          <PlaybackRate.Current rate={1.5}>*</PlaybackRate.Current>
        </PlayerContext.Provider>,
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  it("should support composition of components", () => {
    render(
      <PlayerContext.Provider value={mockPlayerContext}>
        <PlaybackRate>
          <PlaybackRate.Set rate={2.0} data-testid="set-button">
            2.0x
          </PlaybackRate.Set>
          <PlaybackRate.Display />
        </PlaybackRate>
      </PlayerContext.Provider>,
    );

    const button = screen.getByLabelText("Set playback rate to 2x");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("1.5x")).toBeInTheDocument();
    expect(screen.getByText("2.0x")).toBeInTheDocument();
  });

  it("should render a container with proper accessibility attributes", () => {
    render(
      <PlaybackRate>
        <div data-testid="playback-rate-child">Content</div>
      </PlaybackRate>,
    );

    // Check that the container is rendered with the correct content
    expect(screen.getByTestId("playback-rate-child")).toBeInTheDocument();

    // Check for proper accessibility attributes
    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "Playback rate options");

    // Verify children are rendered inside the container
    expect(container).toContainElement(
      screen.getByTestId("playback-rate-child"),
    );
  });
});
