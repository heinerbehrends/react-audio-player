import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Seek } from "../../src/Player/Seek";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import {
  AudioContext,
  AudioContextType,
} from "../../src/AudioElement/AudioContext";

describe("Seek", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockGetPlayerState = vi.fn().mockReturnValue({
    currentTime: 30,
    duration: 100,
    volume: 0.5,
    unmuteVolumeRef: { current: 0.7 },
  });

  const defaultContext: PlayerContextType = {
    handlePlayerAction: mockHandlePlayerAction,
    getPlayerState: mockGetPlayerState,
    playbackRate: 1,
    volumeState: "high" as const,
    playerState: "paused" as const,
    showCaptions: false,
    isMuted: false,
    timeDisplay: "elapsed" as const,
    audioFiles: [],
    cues: [],
    unmuteVolumeRef: { current: 0.7 },
  };

  const defaultAudioContext: AudioContextType = {
    volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
    audioElementRef: { current: null },
    handleSideEffect: vi.fn(),
    timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
    playbackRateCallbackRef: { current: { handlePlaybackRateAction: vi.fn() } },
  };

  const renderSeek = (amount: number, context = defaultContext) => {
    return render(
      <PlayerContext.Provider value={context}>
        <AudioContext.Provider value={defaultAudioContext}>
          <Seek amount={amount}>Seek {amount}</Seek>
        </AudioContext.Provider>
      </PlayerContext.Provider>
    );
  };

  describe("Rendering", () => {
    it("renders with correct aria-label", () => {
      renderSeek(10);
      expect(screen.getByLabelText("Seek 10")).toBeInTheDocument();
    });

    it("renders children", () => {
      renderSeek(10);
      expect(screen.getByText("Seek 10")).toBeInTheDocument();
    });
  });

  describe("Click behavior", () => {
    it("seeks forward by specified amount", () => {
      renderSeek(10);
      fireEvent.click(screen.getByLabelText("Seek 10"));

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "timeline",
        value: 40, // 30 + 10
      });
    });

    it("seeks backward by specified amount", () => {
      renderSeek(-10);
      fireEvent.click(screen.getByLabelText("Seek -10"));

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "timeline",
        value: 20, // 30 - 10
      });
    });

    it("handles zero seek amount", () => {
      renderSeek(0);
      fireEvent.click(screen.getByLabelText("Seek 0"));

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "timeline",
        value: 30, // currentTime + 0
      });
    });
  });

  describe("Keyboard behavior", () => {
    it("handles keyboard events", () => {
      renderSeek(10);
      fireEvent.keyDown(screen.getByLabelText("Seek 10"), {
        key: "ArrowRight",
      });

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 35, // 30 + 5
        component: "timeline",
      });
    });

    it("ignores keyboard events when component is volume", () => {
      renderSeek(10);
      fireEvent.keyDown(screen.getByLabelText("Seek 10"), {
        key: "ArrowRight",
      });

      // Should not call handlePlayerAction for volume component
      expect(mockHandlePlayerAction).not.toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "volume",
      });
    });
  });

  describe("Disabled state", () => {
    it("is disabled when player is in loading state", () => {
      const context = {
        ...defaultContext,
        playerState: "loading" as const,
      };
      renderSeek(10, context);
      expect(screen.getByLabelText("Seek 10")).toBeDisabled();
    });

    it("is disabled when player is in error state", () => {
      const context = {
        ...defaultContext,
        playerState: "error" as const,
      };
      renderSeek(10, context);
      expect(screen.getByLabelText("Seek 10")).toBeDisabled();
    });

    it("is enabled when player is in paused state", () => {
      renderSeek(10);
      expect(screen.getByLabelText("Seek 10")).not.toBeDisabled();
    });

    it("is enabled when player is in playing state", () => {
      const context = {
        ...defaultContext,
        playerState: "playing" as const,
      };
      renderSeek(10, context);
      expect(screen.getByLabelText("Seek 10")).not.toBeDisabled();
    });
  });
});
