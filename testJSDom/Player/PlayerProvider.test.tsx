import React, { useContext } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerContextProvider } from "../../src/Player/PlayerProvider";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import { AudioContext } from "../../src/AudioElement/AudioContext";

describe("PlayerContextProvider", () => {
  const mockAudioElement = {
    duration: 100,
    currentTime: 50,
    volume: 0.5,
    playbackRate: 1,
  } as HTMLAudioElement;

  const mockHandleSideEffect = vi.fn();
  const mockAudioContext = {
    audioElementRef: { current: mockAudioElement },
    handleSideEffect: mockHandleSideEffect,
    volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
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

  // Create a test component to access context values
  const TestConsumer = ({
    testId = "test-value",
    onMount,
  }: {
    testId?: string;
    onMount?: (context: PlayerContextType) => void;
  }) => {
    const context = useContext(PlayerContext);

    React.useEffect(() => {
      if (!context || !onMount) return;
      onMount(context);
    }, [context, onMount]);

    return (
      <div>
        <button
          onClick={() => context.handlePlayerAction({ type: "TOGGLE_PLAY" })}
        >
          Toggle Play
        </button>
        <button
          onClick={() =>
            context.handlePlayerAction({
              type: "SET_UNMUTE_VOLUME",
              unmuteVolume: 0.7,
            })
          }
        >
          Set Unmute Volume
        </button>
        <div data-testid={`${testId}-player-state`}>{context.playerState}</div>
        <div data-testid={`${testId}-volume-state`}>{context.volumeState}</div>
        <div data-testid={`${testId}-playback-rate`}>
          {context.playbackRate}
        </div>
        <div data-testid={`${testId}-unmute-volume`}>
          {context.unmuteVolumeRef.current}
        </div>
      </div>
    );
  };

  const renderWithProvider = (audioFiles = [{ src: "test.mp3" }]) => {
    return render(
      <AudioContext.Provider value={mockAudioContext}>
        <PlayerContextProvider audioFiles={audioFiles}>
          <TestConsumer />
        </PlayerContextProvider>
      </AudioContext.Provider>
    );
  };

  describe("Initialization", () => {
    it("initializes with correct default values", () => {
      renderWithProvider();
      expect(screen.getByTestId("test-value-player-state")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("test-value-volume-state")).toHaveTextContent(
        "high"
      );
      expect(screen.getByTestId("test-value-playback-rate")).toHaveTextContent(
        "1"
      );
      expect(screen.getByTestId("test-value-unmute-volume")).toHaveTextContent(
        "1"
      );
    });

    it("initializes with provided audio files", () => {
      const audioFiles = [
        { src: "test1.mp3", captionSrc: "test1.vtt" },
        { src: "test2.mp3" },
      ];
      renderWithProvider(audioFiles);
      expect(screen.getByTestId("test-value-player-state")).toBeInTheDocument();
    });
  });

  describe("getPlayerState", () => {
    it("returns correct state from audio element", () => {
      let contextValue: PlayerContextType | undefined;
      render(
        <AudioContext.Provider value={mockAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <TestConsumer
              onMount={(context) => {
                contextValue = context;
              }}
            />
          </PlayerContextProvider>
        </AudioContext.Provider>
      );

      expect(contextValue).toBeDefined();
      const state = contextValue!.getPlayerState();
      expect(state).toEqual({
        duration: 100,
        currentTime: 50,
        volume: 0.5,
        playbackRate: 1,
        volumeState: "high",
        unmuteVolumeRef: expect.any(Object),
      });
    });

    it("handles null audio element gracefully", () => {
      const nullAudioContext = {
        ...mockAudioContext,
        audioElementRef: { current: null },
      };

      let contextValue: PlayerContextType | undefined;
      render(
        <AudioContext.Provider value={nullAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <TestConsumer
              onMount={(context) => {
                contextValue = context;
              }}
            />
          </PlayerContextProvider>
        </AudioContext.Provider>
      );

      expect(contextValue).toBeDefined();
      const state = contextValue!.getPlayerState();
      expect(state).toEqual({
        duration: 0,
        currentTime: 0,
        volume: 1,
        playbackRate: 1,
        volumeState: "high",
        unmuteVolumeRef: expect.any(Object),
      });
    });
  });

  describe("handlePlayerAction", () => {
    it("handles side effect actions", () => {
      renderWithProvider();
      fireEvent.click(screen.getByText("Toggle Play"));
      expect(mockHandleSideEffect).toHaveBeenCalledWith(
        { type: "TOGGLE_PLAY" },
        mockAudioElement
      );
    });
  });

  describe("Memoization", () => {
    it("memoizes context value", () => {
      const renderSpy = vi.fn();

      function ContextTracker() {
        const context = useContext(PlayerContext);
        renderSpy(context);
        return null;
      }

      const { rerender } = render(
        <AudioContext.Provider value={mockAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <ContextTracker />
          </PlayerContextProvider>
        </AudioContext.Provider>
      );

      const firstContext = renderSpy.mock.calls[0][0];

      rerender(
        <AudioContext.Provider value={mockAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <ContextTracker />
          </PlayerContextProvider>
        </AudioContext.Provider>
      );

      const secondContext = renderSpy.mock.calls[1][0];
      expect(secondContext).toBe(firstContext);
    });
  });

  describe("Error Handling", () => {
    it("handles missing audio files gracefully", () => {
      renderWithProvider([]);
      expect(screen.getByTestId("test-value-player-state")).toHaveTextContent(
        "loading"
      );
    });

    it("handles invalid audio file format gracefully", () => {
      renderWithProvider([{ src: "" }]);
      expect(screen.getByTestId("test-value-player-state")).toHaveTextContent(
        "loading"
      );
    });
  });
});
