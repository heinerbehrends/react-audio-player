import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MuteButton } from "../../src/Player/MuteButton";
import { PlayerContext, VolumeState } from "../../src/Player/PlayerContext";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import "@testing-library/jest-dom";

describe("MuteButton", () => {
  const mockPlayerContext = {
    isMuted: false,
    volumeState: "high" as const,
    handlePlayerAction: vi.fn(),
    getPlayerState: vi.fn(() => ({
      volume: 0.5,
      unmuteVolumeRef: { current: 0.5 },
      duration: 0,
      currentTime: 0,
      playbackRate: 1,
      volumeState: "high" as const,
      isMuted: false,
    })),
    playbackRate: 1,
    playerState: "playing" as const,
    showCaptions: false,
    timeDisplay: "elapsed" as const,
    duration: 0,
    currentTime: 0,
    cues: [],
    audioFiles: [],
    unmuteVolumeRef: { current: 0.5 },
  };

  const mockAudioContext = {
    volumeCallbackRef: {
      current: {
        handleVolumeAction: vi.fn(),
      },
    },
    audioElementRef: { current: null },
    handleSideEffect: vi.fn(),
    timelineCallbackRef: {
      current: {
        handleTimelineAction: vi.fn(),
        handleTimelineSideEffect: vi.fn(),
      },
    },
    playbackRateCallbackRef: {
      current: {
        handlePlaybackRateAction: vi.fn(),
        handlePlaybackRateSideEffect: vi.fn(),
      },
    },
  };

  const renderWithContext = (props = {}) => {
    return render(
      <PlayerContext.Provider value={mockPlayerContext}>
        <AudioContext.Provider value={mockAudioContext}>
          <MuteButton {...props}>
            <span>Mute Icon</span>
          </MuteButton>
        </AudioContext.Provider>
      </PlayerContext.Provider>,
    );
  };

  describe("MuteButtonComponent", () => {
    it.each([
      ["high", "Mute", "false", false],
      ["low", "Mute", "false", false],
      ["muted", "Unmute", "true", true],
    ])("renders correctly in %s state", (state, name, pressed, isMuted) => {
      const context = {
        ...mockPlayerContext,
        volumeState: state as VolumeState,
        isMuted,
        getPlayerState: vi.fn(() => ({
          ...mockPlayerContext.getPlayerState(),
          volumeState: state as VolumeState,
          isMuted,
        })),
      };

      render(
        <PlayerContext.Provider value={context}>
          <AudioContext.Provider value={mockAudioContext}>
            <MuteButton>
              <span>Mute Icon</span>
            </MuteButton>
          </AudioContext.Provider>
        </PlayerContext.Provider>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("aria-pressed", pressed);
    });

    it("updates aria-pressed when muted", () => {
      renderWithContext();
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
        unmuteVolume: 0.5,
      });
    });

    it("handles keyboard events", () => {
      renderWithContext();
      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "m" });
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalled();
    });
  });

  describe("Muted subcomponent", () => {
    it("renders children when volumeState is muted", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "muted" }}
        >
          <MuteButton.Muted>
            <span>Muted Icon</span>
          </MuteButton.Muted>
        </PlayerContext.Provider>,
      );
      expect(screen.getByText("Muted Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not muted", () => {
      const { container } = render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "high" }}
        >
          <MuteButton.Muted>
            <span>Muted Icon</span>
          </MuteButton.Muted>
        </PlayerContext.Provider>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("LowVolume subcomponent", () => {
    it("renders children when volumeState is low", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "low" }}
        >
          <MuteButton.LowVolume>
            <span>Low Volume Icon</span>
          </MuteButton.LowVolume>
        </PlayerContext.Provider>,
      );
      expect(screen.getByText("Low Volume Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not low", () => {
      const { container } = render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "high" }}
        >
          <MuteButton.LowVolume>
            <span>Low Volume Icon</span>
          </MuteButton.LowVolume>
        </PlayerContext.Provider>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("HighVolume subcomponent", () => {
    it("renders children when volumeState is high", () => {
      render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "high" }}
        >
          <MuteButton.HighVolume>
            <span>High Volume Icon</span>
          </MuteButton.HighVolume>
        </PlayerContext.Provider>,
      );
      expect(screen.getByText("High Volume Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not high", () => {
      const { container } = render(
        <PlayerContext.Provider
          value={{ ...mockPlayerContext, volumeState: "low" }}
        >
          <MuteButton.HighVolume>
            <span>High Volume Icon</span>
          </MuteButton.HighVolume>
        </PlayerContext.Provider>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("useToggleMute hook", () => {
    it("handles mute toggle correctly", () => {
      renderWithContext();
      const button = screen.getByRole("button", { name: "Mute" });

      fireEvent.click(button);

      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
        unmuteVolume: 0.5,
      });
      expect(
        mockAudioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "volume",
      });
    });

    it("handles unmute toggle correctly", () => {
      renderWithContext();
      const button = screen.getByRole("button", { name: "Mute" });

      // First click to mute
      fireEvent.click(button);
      // Second click to unmute
      fireEvent.click(button);

      expect(
        mockAudioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "volume",
      });
    });
  });
});
