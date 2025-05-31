import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  PlayerContext,
  initialState,
  PlayerState,
  VolumeState,
} from "../../src/Player/PlayerContext";

describe("PlayerContext", () => {
  describe("initialState", () => {
    it("has correct default values", () => {
      expect(initialState).toEqual({
        handlePlayerAction: expect.any(Function),
        playerState: "loading",
        showCaptions: true,
        isMuted: false,
        playbackRate: 1,
        volumeState: "high",
        unmuteVolumeRef: { current: 1 },
        getPlayerState: expect.any(Function),
        timeDisplay: "elapsed",
        audioFiles: [],
        cues: [],
      });
    });

    it("getPlayerState returns correct default state", () => {
      const state = initialState.getPlayerState();
      expect(state).toEqual({
        duration: 0,
        currentTime: 0,
        volume: 1,
        playbackRate: 1,
        volumeState: "high",
        unmuteVolumeRef: { current: 1 },
      });
    });
  });

  describe("Context Provider", () => {
    const mockHandlePlayerAction = vi.fn();
    const mockGetPlayerState = vi.fn(() => ({
      duration: 100,
      currentTime: 50,
      volume: 0.5,
      playbackRate: 1,
      volumeState: "high" as VolumeState,
      unmuteVolumeRef: { current: 0.5 },
    }));

    const TestComponent = () => {
      const context = React.useContext(PlayerContext);
      return (
        <div>
          <button
            onClick={() => context.handlePlayerAction({ type: "TOGGLE_PLAY" })}
          >
            Toggle Play
          </button>
          <div data-testid="player-state">{context.playerState}</div>
          <div data-testid="volume-state">{context.volumeState}</div>
          <div data-testid="playback-rate">{context.playbackRate}</div>
        </div>
      );
    };

    it("provides context values to children", () => {
      render(
        <PlayerContext.Provider
          value={{
            ...initialState,
            handlePlayerAction: mockHandlePlayerAction,
            getPlayerState: mockGetPlayerState,
            playerState: "playing" as PlayerState,
            volumeState: "high" as VolumeState,
            playbackRate: 1.5,
          }}
        >
          <TestComponent />
        </PlayerContext.Provider>,
      );

      expect(screen.getByTestId("player-state")).toHaveTextContent("playing");
      expect(screen.getByTestId("volume-state")).toHaveTextContent("high");
      expect(screen.getByTestId("playback-rate")).toHaveTextContent("1.5");
    });

    it("handles player actions", () => {
      render(
        <PlayerContext.Provider
          value={{
            ...initialState,
            handlePlayerAction: mockHandlePlayerAction,
            getPlayerState: mockGetPlayerState,
          }}
        >
          <TestComponent />
        </PlayerContext.Provider>,
      );

      fireEvent.click(screen.getByText("Toggle Play"));
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });

    it("provides getPlayerState functionality", () => {
      render(
        <PlayerContext.Provider
          value={{
            ...initialState,
            handlePlayerAction: mockHandlePlayerAction,
            getPlayerState: mockGetPlayerState,
          }}
        >
          <TestComponent />
        </PlayerContext.Provider>,
      );

      const state = mockGetPlayerState();
      expect(state).toEqual({
        duration: 100,
        currentTime: 50,
        volume: 0.5,
        playbackRate: 1,
        volumeState: "high",
        unmuteVolumeRef: { current: 0.5 },
      });
    });
  });
});
