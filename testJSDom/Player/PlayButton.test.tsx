import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayButton } from "../../src/Player/PlayButton";
import { PlayerContext, PlayerState } from "../../src/Player/PlayerContext";
import "@testing-library/jest-dom";

describe("PlayButton", () => {
  const mockPlayerContext = {
    playerState: "paused" as const,
    handlePlayerAction: vi.fn(),
    getPlayerState: vi.fn(() => ({
      duration: 0,
      currentTime: 0,
      volume: 0.5,
      unmuteVolumeRef: { current: 0.5 },
      playbackRate: 1,
      volumeState: "high" as const,
    })),
    playbackRate: 1,
    volumeState: "high" as const,
    showCaptions: false,
    isMuted: false,
    unmuteVolumeRef: { current: 0.5 },
    timeDisplay: "elapsed" as const,
    duration: 0,
    currentTime: 0,
    cues: [],
    audioFiles: [],
  };

  const renderWithContext = (playerState = "paused" as PlayerState) => {
    return render(
      <PlayerContext.Provider value={{ ...mockPlayerContext, playerState }}>
        <PlayButton>
          <span>Play Icon</span>
        </PlayButton>
      </PlayerContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PlayButtonComponent", () => {
    it.each([
      ["paused", "Play audio", "false", false],
      ["playing", "Pause audio", "true", false],
      ["loading", "Loading audio", "false", true],
      ["error", "Error loading audio", "false", true],
    ])("renders correctly in %s state", (state, name, pressed, disabled) => {
      renderWithContext(state as PlayerState);
      const button = screen.getByRole("button");

      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("aria-pressed", pressed);
      if (disabled) {
        expect(button).toBeDisabled();
      }
    });

    it("handles click events", () => {
      renderWithContext("paused");
      const button = screen.getByRole("button", { name: "Play audio" });
      fireEvent.click(button);
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });

    it("handles keyboard events", () => {
      renderWithContext("paused");
      const button = screen.getByRole("button", { name: "Play audio" });
      fireEvent.keyDown(button, { key: "p" });
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalled();
    });
  });

  describe("Playing subcomponent", () => {
    it("renders children when player state is playing", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, playerState: "playing" }}
        >
          <PlayButton.Playing>
            <span>Playing Icon</span>
          </PlayButton.Playing>
        </PlayerContext.Provider>
      );
      expect(screen.getByText("Playing Icon")).toBeInTheDocument();
    });

    it("returns null when player state is not playing", () => {
      const { container } = render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, playerState: "paused" }}
        >
          <PlayButton.Playing>
            <span>Playing Icon</span>
          </PlayButton.Playing>
        </PlayerContext.Provider>
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Paused subcomponent", () => {
    it("renders children when player state is not playing", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, playerState: "paused" }}
        >
          <PlayButton.Paused>
            <span>Paused Icon</span>
          </PlayButton.Paused>
        </PlayerContext.Provider>
      );
      expect(screen.getByText("Paused Icon")).toBeInTheDocument();
    });

    it("returns null when player state is playing", () => {
      const { container } = render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, playerState: "playing" }}
        >
          <PlayButton.Paused>
            <span>Paused Icon</span>
          </PlayButton.Paused>
        </PlayerContext.Provider>
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("usePlayButtonProps hook", () => {
    it("returns correct props for playing state", () => {
      renderWithContext("playing");
      const button = screen.getByRole("button", { name: "Pause audio" });
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).not.toBeDisabled();
    });

    it("returns correct props for loading state", () => {
      renderWithContext("loading");
      const button = screen.getByRole("button", { name: "Loading audio" });
      expect(button).toBeDisabled();
    });

    it("returns correct props for error state", () => {
      renderWithContext("error");
      const button = screen.getByRole("button", {
        name: "Error loading audio",
      });
      expect(button).toBeDisabled();
    });
  });
});
